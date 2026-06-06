import { ResponseCache } from '@@cache';
import { PrismaService } from '@@db';
import { PatchNoteStatus, ScrapeSource } from '@@prisma';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { isDefined } from 'class-validator';

import { HERO_CATALOG_BY_CODENAME } from '../../domain/hero-catalog';
import { HeroIconMatcher } from '../../seeder';
import { ScrapeJobRecorder, ScraperHttpClient } from '../common';
import { NamuwikiHeroScraper } from '../namuwiki/namuwiki-hero.scraper';
import { BlizzardPatchParser } from './blizzard-patch.parser';
import type { ParsedPatchEntry, ParsedPatchNote } from './dto/parsed-patch-note.dto';

const PATCH_NOTES_URL = 'https://overwatch.blizzard.com/ko-kr/news/patch-notes/';

interface SyncSummary {
  fetched: number;
  created: number;
  updated: number;
  pendingReview: number;
  skipped: number;
  /** 새로 created되거나 (PUBLISHED 아닌) updated된 patch의 entries에 등장한 unique hero ids */
  affectedHeroIds: number[];
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
    private readonly namuwikiScraper: NamuwikiHeroScraper,
    @Inject(forwardRef(() => HeroIconMatcher))
    private readonly iconMatcher: HeroIconMatcher,
  ) {}

  async sync(): Promise<SyncSummary> {
    const summary = await this.recorder.run({
      source: ScrapeSource.BLIZZARD_PATCH_NOTES,
      target: PATCH_NOTES_URL,
      task: async () => {
        const html = await this.httpClient.fetchHtml(PATCH_NOTES_URL);
        const parsed = this.parser.parse(html, PATCH_NOTES_URL);
        const persisted = await this.persist(parsed);
        return { result: persisted, diffSummary: { ...persisted } };
      },
    });
    if (summary.created > 0 || summary.updated > 0) {
      await this.responseCache.invalidateAll();
    }
    if (summary.affectedHeroIds.length > 0) {
      this.syncAffectedHeroes(summary.affectedHeroIds).catch((error: unknown) => {
        this.logger.error(`syncAffectedHeroes failed: ${(error as Error).message}`, (error as Error).stack);
      });
    }
    return summary;
  }

  /**
   * 새 패치 발견 → entries에 등장한 영웅들을 백그라운드로 재동기화.
   * - namuwiki 영웅 페이지(능력 stats) 재크롤 — 며칠 안에 사용자들이 반영하는 점 활용
   * - Blizzard ko-kr 페이지(능력/특전 아이콘 + perks 시드) 재크롤 — 패치로 perks가 reroll되면 자동 반영
   * 두 단계 모두 diff logger가 hero_change_logs에 변경 사항 기록.
   * 한 영웅 실패가 다음 영웅을 막지 않게 catch.
   */
  private async syncAffectedHeroes(heroIds: number[]): Promise<void> {
    const heroes = await this.prismaService.hero.findMany({
      where: { id: { in: heroIds } },
      select: { codename: true },
    });
    this.logger.log(`patch sync triggered hero auto-sync: ${heroes.length} heroes`);

    for (const { codename } of heroes) {
      const catalog = HERO_CATALOG_BY_CODENAME[codename];
      if (!catalog) {
        this.logger.warn(`auto-sync skip ${codename}: not in HERO_CATALOG`);
        continue;
      }
      try {
        const result = await this.namuwikiScraper.sync(codename, catalog.pageTitle, {
          role: catalog.role,
          subrole: catalog.subrole,
          releasedAt: new Date(catalog.releasedAt),
        });
        this.logger.log(`auto-sync namu ${codename}: abilities=${result.abilitiesCount} hasStat=${result.hasStat}`);
      } catch (error) {
        this.logger.warn(`auto-sync namu ${codename} failed: ${(error as Error).message}`);
      }
      try {
        const result = await this.iconMatcher.downloadFor(codename);
        this.logger.log(
          `auto-sync icons ${codename}: abil=${result.abilityMatched}/${result.abilityTotal} perks=${result.perkMatched}/${result.perkTotal}`,
        );
      } catch (error) {
        this.logger.warn(`auto-sync icons ${codename} failed: ${(error as Error).message}`);
      }
    }

    this.logger.log('patch-triggered hero auto-sync complete');
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
          return {
            result: { pageSummary: summary, prevUrl: prev, reachedUntil: reached },
            diffSummary: { ...summary, url, prevUrl: prev ?? '' },
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
    };
    const affected = new Set<number>();

    for (const patch of patches) {
      try {
        const existing = await this.prismaService.patchNote.findUnique({
          where: { version: patch.version },
        });

        const { entries, hasUnmappedHero } = await this.resolveEntries(patch.entries);
        const status = hasUnmappedHero ? PatchNoteStatus.PENDING_REVIEW : PatchNoteStatus.DRAFT;

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
            for (const entry of entries) {
              if (entry.heroId !== null) {
                affected.add(entry.heroId);
              }
            }
          }
        } else {
          await this.prismaService.patchNote.create({
            data: {
              version: patch.version,
              title: patch.title,
              releasedAt: patch.releasedAt,
              sourceUrl: patch.sourceUrl,
              summary: patch.summary,
              status,
              entries: { create: entries },
            },
          });
          summary.created += 1;
          for (const entry of entries) {
            if (entry.heroId !== null) {
              affected.add(entry.heroId);
            }
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
