import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@@db';
import { PatchNoteStatus, ScrapeSource } from '@@prisma';

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

@Injectable()
export class BlizzardPatchScraper {
  private readonly logger = new Logger(BlizzardPatchScraper.name);

  constructor(
    private readonly httpClient: ScraperHttpClient,
    private readonly parser: BlizzardPatchParser,
    private readonly recorder: ScrapeJobRecorder,
    private readonly prismaService: PrismaService,
  ) {}

  async sync(): Promise<SyncSummary> {
    return await this.recorder.run({
      source: ScrapeSource.BLIZZARD_PATCH_NOTES,
      target: PATCH_NOTES_URL,
      task: async () => {
        const html = await this.httpClient.fetchHtml(PATCH_NOTES_URL);
        const parsed = this.parser.parse(html, PATCH_NOTES_URL);
        const summary = await this.persist(parsed);
        return { result: summary, diffSummary: { ...summary } };
      },
    });
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

  private async resolveEntries(
    parsed: ParsedPatchEntry[],
  ): Promise<{ entries: Array<{ category: ParsedPatchEntry['category']; title: string; body: string; order: number; heroId: number | null }>; hasUnmappedHero: boolean }> {
    const heroNames = parsed
      .map((entry) => entry.heroName)
      .filter((name): name is string => Boolean(name));
    const heroes = heroNames.length
      ? await this.prismaService.hero.findMany({ where: { name: { in: heroNames } } })
      : [];
    const heroByName = new Map(heroes.map((hero) => [hero.name, hero.id]));

    let hasUnmappedHero = false;
    const entries = parsed.map(({ heroCodename: _codename, heroName, ...entry }) => {
      const heroId = heroName ? heroByName.get(heroName) ?? null : null;
      if (heroName && heroId === null) hasUnmappedHero = true;
      return { ...entry, heroId };
    });

    return { entries, hasUnmappedHero };
  }
}
