import { ResponseCache } from '@@cache';
import { PrismaService } from '@@db';
import { PatchNoteStatus, ScrapeSource } from '@@prisma';
import { Injectable, Logger } from '@nestjs/common';

import { ScrapeJobRecorder, ScraperHttpClient } from '../common';
import { BlizzardPatchParser } from './blizzard-patch.parser';
import type { ParsedPatchEntry, ParsedPatchNote } from './dto/parsed-patch-note.dto';

const PATCH_NOTES_URL = 'https://overwatch.blizzard.com/ko-kr/news/patch-notes/';

interface SyncSummary {
  fetched: number;
  created: number;
  updated: number;
  pendingReview: number;
  skipped: number;
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
    return summary;
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

  private async persist(patches: ParsedPatchNote[]): Promise<SyncSummary> {
    const summary: SyncSummary = {
      fetched: patches.length,
      created: 0,
      updated: 0,
      pendingReview: 0,
      skipped: 0,
    };

    for (const patch of patches) {
      try {
        const existing = await this.prismaService.patchNote.findUnique({
          where: { version: patch.version },
        });

        const { entries, hasUnmappedHero } = await this.resolveEntries(patch.entries);
        const status = hasUnmappedHero ? PatchNoteStatus.PENDING_REVIEW : PatchNoteStatus.DRAFT;

        if (existing) {
          await this.prismaService.patchNote.update({
            where: { id: existing.id },
            data: {
              title: patch.title,
              releasedAt: patch.releasedAt,
              summary: patch.summary,
              entries: { deleteMany: {}, create: entries },
              status: existing.status === PatchNoteStatus.PUBLISHED ? existing.status : status,
            },
          });
          summary.updated += 1;
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
        }

        if (status === PatchNoteStatus.PENDING_REVIEW) summary.pendingReview += 1;
      } catch (error) {
        this.logger.warn(`persist patch ${patch.version} failed: ${(error as Error).message}`);
        summary.skipped += 1;
      }
    }

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
    const heroNames = parsed.map((entry) => entry.heroName).filter((name): name is string => Boolean(name));
    const heroes =
      heroNames.length > 0 ? await this.prismaService.hero.findMany({ where: { name: { in: heroNames } } }) : [];
    const heroByName = new Map(heroes.map((hero) => [hero.name, hero.id]));

    let hasUnmappedHero = false;
    const entries = parsed.map(({ heroCodename: _codename, heroName, ...entry }) => {
      const heroId = heroName ? (heroByName.get(heroName) ?? null) : null;
      if (heroName && heroId === null) hasUnmappedHero = true;
      return { ...entry, heroId };
    });

    return { entries, hasUnmappedHero };
  }
}
