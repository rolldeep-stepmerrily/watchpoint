import { PrismaService } from '@@db';
import { Prisma, ScrapeSource } from '@@prisma';
import { Injectable, Logger } from '@nestjs/common';

import { ScrapeJobRecorder, ScraperHttpClient } from '../common';
import { BlizzardPatchParser } from './blizzard-patch.parser';

const PATCH_NOTES_EN_URL = 'https://overwatch.blizzard.com/en-us/news/patch-notes/';

interface SyncSummary {
  fetched: number;
  matched: number;
  skipped: number;
}

@Injectable()
export class BlizzardPatchEnScraper {
  private readonly logger = new Logger(BlizzardPatchEnScraper.name);

  constructor(
    private readonly httpClient: ScraperHttpClient,
    private readonly parser: BlizzardPatchParser,
    private readonly recorder: ScrapeJobRecorder,
    private readonly prismaService: PrismaService,
  ) {}

  async sync(): Promise<SyncSummary> {
    return await this.recorder.run({
      source: ScrapeSource.BLIZZARD_PATCH_NOTES_EN,
      target: PATCH_NOTES_EN_URL,
      task: async () => {
        const html = await this.httpClient.fetchHtml(PATCH_NOTES_EN_URL);
        const parsed = this.parser.parse(html, PATCH_NOTES_EN_URL);
        const summary = await this.applyTranslations(parsed);
        return { result: summary, diffSummary: { ...summary } };
      },
    });
  }

  /**
   * version 기준으로 DB의 PatchNote를 찾아 titleTranslations.en / summaryTranslations.en 병합 갱신.
   * 영문 페이지에만 있고 DB에 없는 patch는 skip (한국어 sync가 먼저 돌아야 함).
   * 영문 페이지의 releasedAt은 무시 (DB의 한국어 sync 값 유지).
   * Entry-level 번역은 본 PR 범위 외 — 별도 후속.
   */
  private async applyTranslations(patches: ReturnType<BlizzardPatchParser['parse']>): Promise<SyncSummary> {
    const summary: SyncSummary = { fetched: patches.length, matched: 0, skipped: 0 };

    for (const patch of patches) {
      const existing = await this.prismaService.patchNote.findUnique({
        where: { version: patch.version },
        select: { id: true, titleTranslations: true, summaryTranslations: true },
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
    }

    if (summary.skipped > 0) {
      this.logger.warn(`patch en sync: skipped ${summary.skipped} patches not in DB (run patch:sync first)`);
    }
    return summary;
  }
}

function mergeTranslation(current: unknown, locale: string, value: string): Record<string, string> {
  const base = current && typeof current === 'object' ? (current as Record<string, string>) : {};
  return { ...base, [locale]: value };
}
