import { ResponseCache } from '@@cache';
import { PrismaService } from '@@db';
import { PatchNoteStatus, Prisma, ScrapeSource } from '@@prisma';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { isDefined } from 'class-validator';

import { HeroIconMatcher } from '../../seeder';
import { ScrapeJobRecorder, ScraperHttpClient } from '../common';
import { WebRevalidatorService } from '../web';
import { BlizzardHeroKoScraper } from './blizzard-hero-ko.scraper';
import { BlizzardPatchParser } from './blizzard-patch.parser';
import type { ParsedPatchEntry, ParsedPatchNote } from './dto/parsed-patch-note.dto';

const PATCH_NOTES_URL = 'https://overwatch.blizzard.com/ko-kr/news/patch-notes/';

interface AffectedPatch {
  patchNoteId: number;
  heroIds: number[];
}

interface SyncSummary {
  fetched: number;
  created: number;
  updated: number;
  pendingReview: number;
  skipped: number;
  /** 새로 created되거나 (PUBLISHED 아닌) updated된 patch의 entries에 등장한 unique hero ids */
  affectedHeroIds: number[];
  /** 새로 created되거나 (PUBLISHED 아닌) updated된 patch의 version 목록 — ISR revalidate 대상 */
  affectedVersions: string[];
  /** patchNoteId ↔ heroIds 매핑. HeroStatRevision 작성용 */
  affectedByPatch: AffectedPatch[];
}

interface BackfillOptions {
  until?: Date;
  maxPages?: number;
}

interface BackfillSummary {
  pagesFetched: number;
  patchesFetched: number;
  created: number;
  updated: number;
  pendingReview: number;
  skipped: number;
  stoppedAt: string;
}

@Injectable()
export class BlizzardPatchScraper {
  private readonly logger = new Logger(BlizzardPatchScraper.name);

  constructor(
    private readonly httpClient: ScraperHttpClient,
    private readonly parser: BlizzardPatchParser,
    private readonly recorder: ScrapeJobRecorder,
    private readonly prismaService: PrismaService,
    private readonly responseCache: ResponseCache,
    private readonly koScraper: BlizzardHeroKoScraper,
    @Inject(forwardRef(() => HeroIconMatcher))
    private readonly iconMatcher: HeroIconMatcher,
    private readonly webRevalidator: WebRevalidatorService,
  ) {}

  async sync(): Promise<SyncSummary> {
    // syncAffectedHeroes 안에서 HeroStatRevision diff를 만들 때, 이 시각 이후에 작성된
    // hero_change_logs만 묶기 위한 cutoff. patch sync의 entries persistence가 끝난 직후 시각으로 잡으면
    // diff logger가 실제로 영웅 sync에서 기록한 changes만 정확히 골라낼 수 있다.
    const tickStartedAt = new Date();
    const summary = await this.recorder.run({
      source: ScrapeSource.BLIZZARD_PATCH_NOTES,
      target: PATCH_NOTES_URL,
      task: async () => {
        const html = await this.httpClient.fetchHtml(PATCH_NOTES_URL);
        const parsed = this.parser.parse(html, PATCH_NOTES_URL);
        const persisted = await this.persist(parsed);
        // recorder의 diffSummary는 Prisma JSON에 저장되니 affectedByPatch는 빼서 전달.
        const { affectedByPatch: _, ...diffSummary } = persisted;
        return { result: persisted, diffSummary };
      },
    });
    if (summary.created > 0 || summary.updated > 0) {
      await this.responseCache.invalidateAll();
    }
    // patch 자체 변경분은 즉시 web 캐시 무효화. hero 상세는 syncAffectedHeroes 끝에 별도 호출.
    if (summary.affectedVersions.length > 0) {
      await this.webRevalidator.revalidate({ patchVersions: summary.affectedVersions });
    }
    if (summary.affectedHeroIds.length > 0) {
      this.syncAffectedHeroes(summary.affectedHeroIds, summary.affectedByPatch, tickStartedAt).catch(
        (error: unknown) => {
          this.logger.error(`syncAffectedHeroes failed: ${(error as Error).message}`, (error as Error).stack);
        },
      );
    }
    return summary;
  }

  /**
   * 새 패치 발견 → entries에 등장한 영웅들을 백그라운드로 재동기화.
   * - Blizzard ko-kr 페이지(이름/설명/능력) 재크롤 → diff logger가 hero_change_logs에 기록
   * - 능력/특전 아이콘 재다운로드 → 패치로 perks가 reroll되면 자동 반영
   * - 영웅 sync 후 hero_change_logs를 patch별로 묶어 HeroStatRevision row 작성 (SPEC §1.3)
   * 한 영웅 실패가 다음 영웅을 막지 않게 catch.
   */
  private async syncAffectedHeroes(
    heroIds: number[],
    affectedByPatch: AffectedPatch[],
    tickStartedAt: Date,
  ): Promise<void> {
    const patchesByHero = new Map<number, number[]>();
    for (const { patchNoteId, heroIds: ids } of affectedByPatch) {
      for (const hid of ids) {
        const arr = patchesByHero.get(hid) ?? [];
        arr.push(patchNoteId);
        patchesByHero.set(hid, arr);
      }
    }

    const heroes = await this.prismaService.hero.findMany({
      where: { id: { in: heroIds } },
      select: { id: true, codename: true },
    });
    this.logger.log(`patch sync triggered hero auto-sync: ${heroes.length} heroes`);

    for (const { id: heroId, codename } of heroes) {
      try {
        const result = await this.koScraper.sync(codename);
        this.logger.log(
          `auto-sync ko ${codename}: matched=${result.matched} abilities=${result.abilitiesUpserted}/${result.abilitiesParsed}`,
        );
      } catch (error) {
        this.logger.warn(`auto-sync ko ${codename} failed: ${(error as Error).message}`);
      }
      try {
        const result = await this.iconMatcher.downloadFor(codename);
        this.logger.log(
          `auto-sync icons ${codename}: abil=${result.abilityMatched}/${result.abilityTotal} perks=${result.perkMatched}/${result.perkTotal}`,
        );
      } catch (error) {
        this.logger.warn(`auto-sync icons ${codename} failed: ${(error as Error).message}`);
      }

      try {
        await this.writeRevisions(heroId, codename, patchesByHero.get(heroId) ?? [], tickStartedAt);
      } catch (error) {
        this.logger.warn(`revision write ${codename} failed: ${(error as Error).message}`);
      }
    }

    this.logger.log('patch-triggered hero auto-sync complete');

    const codenames = heroes.map((h) => h.codename);
    if (codenames.length > 0) {
      await this.webRevalidator.revalidate({ heroCodenames: codenames });
    }
  }

  /**
   * 영웅 sync로 생성된 hero_change_logs를 묶어 HeroStatRevision row를 작성.
   *
   * v1 구현 한계: 같은 영웅이 한 cron tick에 여러 patch에 영향 받으면 동일 diff가 N개 patch 모두에
   * 매핑된다. PatchNote.entries.body로 fine-grained per-patch 변경을 추출하려면 NLP가 필요해 보류.
   * SPEC §1.3 약속의 "어떤 패치에서 변했는지 추적"은 충족하되, 동일 변경이 patches에 중복 표시되는 점은
   * 향후 수동 보정 또는 별도 분기 작업으로.
   */
  private async writeRevisions(
    heroId: number,
    codename: string,
    patchNoteIds: number[],
    tickStartedAt: Date,
  ): Promise<void> {
    if (patchNoteIds.length === 0) {
      return;
    }
    const changes = await this.prismaService.heroChangeLog.findMany({
      where: { heroId, createdAt: { gte: tickStartedAt } },
      select: { changeType: true, target: true, targetKey: true, before: true, after: true },
      orderBy: { createdAt: 'asc' },
    });
    if (changes.length === 0) {
      return;
    }
    const diff = { changes } as unknown as Prisma.InputJsonValue;
    await Promise.all(
      patchNoteIds.map((patchNoteId) =>
        this.prismaService.heroStatRevision.create({
          data: { heroId, patchNoteId, diff },
        }),
      ),
    );
    this.logger.log(`revision created: ${codename} × ${patchNoteIds.length} patch(es), ${changes.length} change(s)`);
  }

  /**
   * 페이지네이션 링크(--prev)를 따라 과거 패치를 백필.
   * until 이전 패치는 무시하고, 모든 패치가 until보다 오래되면 중단.
   * 페이지마다 별도 ScrapeJob 기록(개별 페이지 실패 추적 용이).
   */
  async backfill({ until, maxPages = 24 }: BackfillOptions = {}): Promise<BackfillSummary> {
    const total: BackfillSummary = {
      pagesFetched: 0,
      patchesFetched: 0,
      created: 0,
      updated: 0,
      pendingReview: 0,
      skipped: 0,
      stoppedAt: '',
    };

    let currentUrl: string | null = PATCH_NOTES_URL;

    while (currentUrl && total.pagesFetched < maxPages) {
      const url: string = currentUrl;
      const page = await this.recorder.run<{
        pageSummary: SyncSummary;
        prevUrl: string | null;
        reachedUntil: boolean;
      }>({
        source: ScrapeSource.BLIZZARD_PATCH_NOTES,
        target: url,
        task: async () => {
          const html = await this.httpClient.fetchHtml(url);
          const parsed = this.parser.parse(html, url);
          const filtered = until ? parsed.filter((patch) => patch.releasedAt >= until) : parsed;
          const reached = until ? filtered.length < parsed.length : false;
          const summary = await this.persist(filtered);
          const prev = this.parser.extractPrevPageUrl(html, url);
          const { affectedByPatch: _, ...diffSummaryBase } = summary;
          return {
            result: { pageSummary: summary, prevUrl: prev, reachedUntil: reached },
            diffSummary: { ...diffSummaryBase, url, prevUrl: prev ?? '' },
          };
        },
      });
      const { pageSummary, prevUrl, reachedUntil } = page;

      total.pagesFetched += 1;
      total.patchesFetched += pageSummary.fetched;
      total.created += pageSummary.created;
      total.updated += pageSummary.updated;
      total.pendingReview += pageSummary.pendingReview;
      total.skipped += pageSummary.skipped;

      if (reachedUntil) {
        total.stoppedAt = `until=${until?.toISOString().slice(0, 10)} 도달`;
        break;
      }
      if (!prevUrl) {
        total.stoppedAt = '더 이전 페이지 없음';
        break;
      }
      currentUrl = prevUrl;
    }

    if (!total.stoppedAt) {
      total.stoppedAt = `maxPages=${maxPages} 도달`;
    }

    if (total.created > 0 || total.updated > 0) {
      await this.responseCache.invalidateAll();
    }
    this.logger.log(
      `backfill 완료 — pages=${total.pagesFetched} patches=${total.patchesFetched} created=${total.created} stopped=${total.stoppedAt}`,
    );
    return total;
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: persist는 patch별 create/update + PUBLISHED 가드 + affected hero 집계가 한 흐름에 묶임. 분할 시 가독성 떨어져서 일단 유지.
  private async persist(patches: ParsedPatchNote[]): Promise<SyncSummary> {
    const summary: SyncSummary = {
      fetched: patches.length,
      created: 0,
      updated: 0,
      pendingReview: 0,
      skipped: 0,
      affectedHeroIds: [],
      affectedVersions: [],
      affectedByPatch: [],
    };
    const affected = new Set<number>();
    const versions = new Set<string>();
    const affectedByPatch: AffectedPatch[] = [];

    for (const patch of patches) {
      try {
        const existing = await this.prismaService.patchNote.findUnique({
          where: { version: patch.version },
        });

        const { entries, hasUnmappedHero } = await this.resolveEntries(patch.entries);
        const status = hasUnmappedHero ? PatchNoteStatus.PENDING_REVIEW : PatchNoteStatus.PUBLISHED;

        if (existing) {
          // PUBLISHED 패치는 검수/번역 완료 상태로 간주 — 메타만 갱신하고 entries는 보존.
          // 그렇지 않으면 cron 재실행이 patch:review 보정과 entry 영문 번역(titleTranslations/bodyTranslations)을 매번 덮어씀.
          const isPublished = existing.status === PatchNoteStatus.PUBLISHED;
          await this.prismaService.patchNote.update({
            where: { id: existing.id },
            data: {
              title: patch.title,
              releasedAt: patch.releasedAt,
              summary: patch.summary,
              ...(isPublished ? {} : { entries: { deleteMany: {}, create: entries } }),
              status: isPublished ? existing.status : status,
            },
          });
          summary.updated += 1;
          if (!isPublished) {
            versions.add(patch.version);
            const heroIdsForPatch: number[] = [];
            for (const entry of entries) {
              if (entry.heroId !== null) {
                affected.add(entry.heroId);
                heroIdsForPatch.push(entry.heroId);
              }
            }
            if (heroIdsForPatch.length > 0) {
              affectedByPatch.push({ patchNoteId: existing.id, heroIds: Array.from(new Set(heroIdsForPatch)) });
            }
          }
        } else {
          const created = await this.prismaService.patchNote.create({
            data: {
              version: patch.version,
              title: patch.title,
              releasedAt: patch.releasedAt,
              sourceUrl: patch.sourceUrl,
              summary: patch.summary,
              status,
              entries: { create: entries },
            },
            select: { id: true },
          });
          summary.created += 1;
          versions.add(patch.version);
          const heroIdsForPatch: number[] = [];
          for (const entry of entries) {
            if (entry.heroId !== null) {
              affected.add(entry.heroId);
              heroIdsForPatch.push(entry.heroId);
            }
          }
          if (heroIdsForPatch.length > 0) {
            affectedByPatch.push({ patchNoteId: created.id, heroIds: Array.from(new Set(heroIdsForPatch)) });
          }
        }

        if (status === PatchNoteStatus.PENDING_REVIEW) {
          summary.pendingReview += 1;
        }
      } catch (error) {
        this.logger.warn(`persist patch ${patch.version} failed: ${(error as Error).message}`);
        summary.skipped += 1;
      }
    }

    summary.affectedHeroIds = Array.from(affected);
    summary.affectedVersions = Array.from(versions);
    summary.affectedByPatch = affectedByPatch;

    return summary;
  }

  private async resolveEntries(parsed: ParsedPatchEntry[]): Promise<{
    entries: Array<{
      category: ParsedPatchEntry['category'];
      title: string;
      body: string;
      order: number;
      heroId: number | null;
    }>;
    hasUnmappedHero: boolean;
  }> {
    const heroNames = parsed.map((entry) => entry.heroName).filter((name): name is string => isDefined(name));
    const heroes =
      heroNames.length > 0 ? await this.prismaService.hero.findMany({ where: { name: { in: heroNames } } }) : [];
    const heroByName = new Map(heroes.map((hero) => [hero.name, hero.id]));

    let hasUnmappedHero = false;
    const entries = parsed.map(({ heroCodename: _codename, heroName, ...entry }) => {
      const heroId = heroName ? (heroByName.get(heroName) ?? null) : null;
      if (heroName && heroId === null) {
        hasUnmappedHero = true;
      }
      return { ...entry, heroId };
    });

    return { entries, hasUnmappedHero };
  }
}
