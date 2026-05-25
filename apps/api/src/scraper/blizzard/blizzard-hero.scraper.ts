import { PrismaService } from '@@db';
import { Prisma, ScrapeSource } from '@@prisma';
import { Injectable } from '@nestjs/common';

import { ScrapeJobRecorder, ScraperHttpClient } from '../common';
import { BlizzardHeroParser } from './blizzard-hero.parser';
import type { ParsedHeroEn } from './dto/parsed-hero-en.dto';

const BLIZZARD_HERO_BASE = 'https://overwatch.blizzard.com/en-us/heroes/';

/**
 * 일부 영웅은 codename과 Blizzard URL slug가 다름. catalog와 분리해 둠 — 영문 페이지 한정 보정값.
 */
const CODENAME_TO_BLIZZARD_SLUG: Readonly<Record<string, string>> = {
  'd-va': 'dva',
};

interface SyncResult {
  codename: string;
  matched: boolean;
}

@Injectable()
export class BlizzardHeroEnScraper {
  constructor(
    private readonly httpClient: ScraperHttpClient,
    private readonly parser: BlizzardHeroParser,
    private readonly recorder: ScrapeJobRecorder,
    private readonly prismaService: PrismaService,
  ) {}

  async sync(codename: string): Promise<SyncResult> {
    const slug = CODENAME_TO_BLIZZARD_SLUG[codename] ?? codename;
    const url = `${BLIZZARD_HERO_BASE}${slug}/`;

    return await this.recorder.run({
      source: ScrapeSource.BLIZZARD_HERO_EN,
      target: url,
      task: async () => {
        const html = await this.httpClient.fetchHtmlOrNullOnClientError(url);
        if (html === null) {
          return { result: { codename, matched: false }, diffSummary: { codename, matched: false } };
        }
        const parsed = this.parser.parse(html, codename, url);
        const matched = await this.applyTranslations(parsed);
        return { result: { codename, matched }, diffSummary: { codename, matched } };
      },
    });
  }

  /**
   * 기존 Hero row를 찾아 nameTranslations.en / descriptionTranslations.en 만 병합 갱신.
   * Hero가 없으면 (catalog/seed 누락) skip.
   */
  private async applyTranslations(parsed: ParsedHeroEn): Promise<boolean> {
    const hero = await this.prismaService.hero.findUnique({
      where: { codename: parsed.codename },
      select: { id: true, nameTranslations: true, descriptionTranslations: true },
    });
    if (!hero) return false;

    const nameTranslations = mergeTranslation(hero.nameTranslations, 'en', parsed.name);
    const descriptionTranslations = parsed.description
      ? mergeTranslation(hero.descriptionTranslations, 'en', parsed.description)
      : hero.descriptionTranslations;

    await this.prismaService.hero.update({
      where: { id: hero.id },
      data: {
        nameTranslations: (nameTranslations ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        descriptionTranslations: (descriptionTranslations ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      },
    });
    return true;
  }
}

function mergeTranslation(current: unknown, locale: string, value: string): Record<string, string> {
  const base = current && typeof current === 'object' ? (current as Record<string, string>) : {};
  return { ...base, [locale]: value };
}
