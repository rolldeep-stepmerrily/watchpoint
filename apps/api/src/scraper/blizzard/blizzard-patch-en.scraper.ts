import { ResponseCache } from '@@cache';
import { PrismaService } from '@@db';
import { Prisma, ScrapeSource } from '@@prisma';
import { Injectable, Logger } from '@nestjs/common';

import { mergeTranslation, ScrapeJobRecorder, ScraperHttpClient } from '../common';
import { WebRevalidatorService } from '../web';
import { BlizzardPatchParser } from './blizzard-patch.parser';
import type { ParsedPatchEntry, ParsedPatchNote } from './dto/parsed-patch-note.dto';

const PATCH_NOTES_EN_URL = 'https://overwatch.blizzard.com/en-us/news/patch-notes/';

interface SyncSummary {
  fetched: number;
  matched: number;
  skipped: number;
  entriesMatched: number;
  entriesTotal: number;
  /** 영문 translations가 새로 들어간 patch version 목록 — ISR revalidate 대상 */
  affectedVersions: string[];
}

@Injectable()
export class BlizzardPatchEnScraper {
  private readonly logger = new Logger(BlizzardPatchEnScraper.name);

  constructor(
    private readonly httpClient: ScraperHttpClient,
    private readonly parser: BlizzardPatchParser,
    private readonly recorder: ScrapeJobRecorder,
    private readonly prismaService: PrismaService,
    private readonly responseCache: ResponseCache,
    private readonly webRevalidator: WebRevalidatorService,
  ) {}

  async sync(): Promise<SyncSummary> {
    const summary = await this.recorder.run({
      source: ScrapeSource.BLIZZARD_PATCH_NOTES_EN,
      target: PATCH_NOTES_EN_URL,
      task: async () => {
        const html = await this.httpClient.fetchHtml(PATCH_NOTES_EN_URL);
        const parsed = this.parser.parse(html, PATCH_NOTES_EN_URL);
        const result = await this.applyTranslations(parsed);
        return { result, diffSummary: { ...result } };
      },
    });
    if (summary.matched > 0 || summary.entriesMatched > 0) {
      await this.responseCache.invalidateAll();
    }
    // 영문 번역이 들어간 patch도 web ISR을 무효화해야 사용자가 1h 안에 영문 내용 본다.
    // KO scraper는 신규 patch에만 revalidate를 쏘므로 en-only 갱신은 여기서 별도 처리.
    if (summary.affectedVersions.length > 0) {
      await this.webRevalidator.revalidate({ patchVersions: summary.affectedVersions });
    }
    return summary;
  }

  /**
   * version 기준으로 DB의 PatchNote를 찾아 title/summary translations + entries translations 병합.
   * Entry 매칭은 heroName(EN) 기반 — DB의 hero.nameTranslations.en으로 영문 영웅명 → hero.id → entry.heroId.
   * 영문 영웅 데이터(hero:sync:en)가 먼저 채워져 있어야 매칭 가능.
   * 영문 페이지에만 있고 DB에 없는 patch는 skip (한국어 sync가 먼저 돌아야 함).
   * 영문 페이지의 releasedAt은 무시.
   */
  private async applyTranslations(patches: ParsedPatchNote[]): Promise<SyncSummary> {
    const summary: SyncSummary = {
      fetched: patches.length,
      matched: 0,
      skipped: 0,
      entriesMatched: 0,
      entriesTotal: 0,
      affectedVersions: [],
    };

    const heroEnIndex = await this.buildHeroEnIndex();
    const affected: string[] = [];

    for (const patch of patches) {
      const existing = await this.prismaService.patchNote.findUnique({
        where: { version: patch.version },
        select: {
          id: true,
          titleTranslations: true,
          summaryTranslations: true,
          entries: { select: { id: true, heroId: true } },
        },
      });
      if (!existing) {
        summary.skipped += 1;
        continue;
      }

      const titleTranslations = mergeTranslation(existing.titleTranslations, 'en', patch.title);
      const summaryTranslations = patch.summary
        ? mergeTranslation(existing.summaryTranslations, 'en', patch.summary)
        : (existing.summaryTranslations as Prisma.JsonValue | null);

      await this.prismaService.patchNote.update({
        where: { id: existing.id },
        data: {
          titleTranslations: titleTranslations as Prisma.InputJsonValue,
          summaryTranslations: (summaryTranslations ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        },
      });
      summary.matched += 1;
      affected.push(patch.version);

      const entryMatched = await this.applyEntryTranslations(existing.entries, patch.entries, heroEnIndex);
      summary.entriesMatched += entryMatched.matched;
      summary.entriesTotal += entryMatched.total;
    }

    summary.affectedVersions = affected;

    if (summary.skipped > 0) {
      this.logger.warn(`patch en sync: skipped ${summary.skipped} patches not in DB (run patch:sync first)`);
    }
    return summary;
  }

  /**
   * heroName(EN) 기반 entry 매칭. 같은 영웅에 대해 KO/EN 양쪽에 entry가 하나씩 있는 일반적인 케이스만 처리.
   * 같은 영웅에 KO 또는 EN에서 여러 entry가 있으면 첫 매칭만 적용하고 나머지는 skip + 경고.
   * non-hero entry(section title 기반)는 매칭이 불안정해 본 단계에서 처리하지 않음 (KO fallback).
   */
  private async applyEntryTranslations(
    dbEntries: ReadonlyArray<{ id: number; heroId: number | null }>,
    parsedEntries: readonly ParsedPatchEntry[],
    heroEnIndex: ReadonlyMap<string, number>,
  ): Promise<{ matched: number; total: number }> {
    const dbHeroEntries = dbEntries.filter((e): e is { id: number; heroId: number } => e.heroId !== null);
    const dbByHeroId = new Map<number, number[]>();
    for (const entry of dbHeroEntries) {
      const list = dbByHeroId.get(entry.heroId) ?? [];
      list.push(entry.id);
      dbByHeroId.set(entry.heroId, list);
    }

    const updates: Array<{ id: number; title: string; body: string }> = [];
    const usedDbIds = new Set<number>();

    for (const parsed of parsedEntries) {
      if (!parsed.heroName) {
        continue;
      }
      const heroId = heroEnIndex.get(parsed.heroName.toLowerCase());
      if (!heroId) {
        continue;
      }
      const candidates = (dbByHeroId.get(heroId) ?? []).filter((id) => !usedDbIds.has(id));
      if (candidates.length === 0) {
        continue;
      }

      const dbEntryId = candidates[0];
      usedDbIds.add(dbEntryId);
      updates.push({ id: dbEntryId, title: parsed.title, body: parsed.body });
    }

    // 기존 translations를 보존하면서 en만 병합. 단순 객체 덮어쓰기는 ja/다른 locale을 모두 지운다.
    const existing =
      updates.length > 0
        ? await this.prismaService.patchNoteEntry.findMany({
            where: { id: { in: updates.map((u) => u.id) } },
            select: { id: true, titleTranslations: true, bodyTranslations: true },
          })
        : [];
    const existingById = new Map(existing.map((e) => [e.id, e]));

    await Promise.all(
      updates.map((u) => {
        const prev = existingById.get(u.id);
        const titleTranslations = mergeTranslation(prev?.titleTranslations ?? null, 'en', u.title);
        const bodyTranslations = mergeTranslation(prev?.bodyTranslations ?? null, 'en', u.body);
        return this.prismaService.patchNoteEntry.update({
          where: { id: u.id },
          data: {
            titleTranslations: titleTranslations as Prisma.InputJsonValue,
            bodyTranslations: bodyTranslations as Prisma.InputJsonValue,
          },
        });
      }),
    );

    return { matched: updates.length, total: dbHeroEntries.length };
  }

  /**
   * DB의 모든 hero를 nameTranslations.en (lower-case) → id 인덱스로 구축.
   * 영문 영웅 데이터가 보강되지 않은 경우 매칭이 0 — hero:sync:en:all 선행 필요.
   */
  private async buildHeroEnIndex(): Promise<ReadonlyMap<string, number>> {
    const heroes = await this.prismaService.hero.findMany({
      select: { id: true, nameTranslations: true },
    });
    const index = new Map<string, number>();
    for (const hero of heroes) {
      if (!hero.nameTranslations || typeof hero.nameTranslations !== 'object') {
        continue;
      }
      const en = (hero.nameTranslations as Record<string, unknown>).en;
      if (typeof en === 'string' && en.length > 0) {
        index.set(en.toLowerCase(), hero.id);
      }
    }
    return index;
  }
}
