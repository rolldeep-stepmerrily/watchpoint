import { ResponseCache } from '@@cache';
import { PrismaService } from '@@db';
import { type AbilitySlot, Prisma, ScrapeSource } from '@@prisma';
import { Injectable, Logger } from '@nestjs/common';

import { mergeTranslation, ScrapeJobRecorder, ScraperHttpClient } from '../common';
import { BlizzardHeroParser } from './blizzard-hero.parser';
import type { ParsedAbilityEn, ParsedHeroEn } from './dto/parsed-hero-en.dto';

const BLIZZARD_HERO_BASE = 'https://overwatch.blizzard.com/en-us/heroes/';

/**
 * 일부 영웅은 codename과 Blizzard URL slug가 다름. catalog와 분리해 둠 — 영문 페이지 한정 보정값.
 */
const CODENAME_TO_BLIZZARD_SLUG: Readonly<Record<string, string>> = {
  'd-va': 'dva',
};

/**
 * Blizzard 영문 페이지의 PRIMARY+SECONDARY 통합 케이스를 풀기 위한 ability 매칭 순서.
 * PASSIVE는 일반적으로 영문 페이지에 카드로 노출되지 않아 매칭 대상에서 제외.
 */
const MATCH_SLOT_ORDER: readonly AbilitySlot[] = ['PRIMARY', 'SECONDARY', 'ABILITY_1', 'ABILITY_2', 'ULTIMATE'];

interface SyncResult {
  codename: string;
  matched: boolean;
  abilitiesMatched: number;
  abilitiesTotal: number;
}

@Injectable()
export class BlizzardHeroEnScraper {
  private readonly logger = new Logger(BlizzardHeroEnScraper.name);

  constructor(
    private readonly httpClient: ScraperHttpClient,
    private readonly parser: BlizzardHeroParser,
    private readonly recorder: ScrapeJobRecorder,
    private readonly prismaService: PrismaService,
    private readonly responseCache: ResponseCache,
  ) {}

  async sync(codename: string): Promise<SyncResult> {
    const slug = CODENAME_TO_BLIZZARD_SLUG[codename] ?? codename;
    const url = `${BLIZZARD_HERO_BASE}${slug}/`;

    const result = await this.recorder.run({
      source: ScrapeSource.BLIZZARD_HERO_EN,
      target: url,
      task: async () => {
        const html = await this.httpClient.fetchHtmlOrNullOnClientError(url);
        if (html === null) {
          const summary: SyncResult = { codename, matched: false, abilitiesMatched: 0, abilitiesTotal: 0 };
          return { result: summary, diffSummary: { ...summary } };
        }
        const parsed = this.parser.parse(html, codename, url);
        const summary = await this.applyTranslations(parsed);
        return { result: summary, diffSummary: { ...summary } };
      },
    });
    if (result.matched) {
      await this.responseCache.invalidateAll();
    }
    return result;
  }

  /**
   * 기존 Hero를 찾아 영문 nameTranslations / descriptionTranslations 병합 갱신.
   * 능력 매칭은 best-effort — DB의 ability(PASSIVE 제외)와 Blizzard 카드 순서를 정렬해 매핑한다.
   * Blizzard 카드 수가 DB ability 수보다 1개 적으면 첫 카드를 PRIMARY+SECONDARY 양쪽에 동일 적용
   * (Blizzard 영문 페이지는 일반적으로 좌·우클릭을 하나의 무기 카드로 묶기 때문).
   */
  private async applyTranslations(parsed: ParsedHeroEn): Promise<SyncResult> {
    const hero = await this.prismaService.hero.findUnique({
      where: { codename: parsed.codename },
      select: {
        id: true,
        nameTranslations: true,
        descriptionTranslations: true,
        abilities: {
          select: { id: true, slot: true, order: true, nameTranslations: true, descriptionTranslations: true },
        },
      },
    });
    if (!hero) {
      return { codename: parsed.codename, matched: false, abilitiesMatched: 0, abilitiesTotal: 0 };
    }

    const nameTranslations = mergeTranslation(hero.nameTranslations, 'en', parsed.name);
    const descriptionTranslations = parsed.description
      ? mergeTranslation(hero.descriptionTranslations, 'en', parsed.description)
      : (hero.descriptionTranslations as Prisma.JsonValue | null);

    await this.prismaService.hero.update({
      where: { id: hero.id },
      data: {
        nameTranslations: (nameTranslations ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        descriptionTranslations: (descriptionTranslations ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      },
    });

    const matchable = hero.abilities
      .filter((a) => MATCH_SLOT_ORDER.includes(a.slot))
      .sort((a, b) => MATCH_SLOT_ORDER.indexOf(a.slot) - MATCH_SLOT_ORDER.indexOf(b.slot) || a.order - b.order);

    const matches = this.matchAbilities(matchable, parsed.abilities);
    let abilitiesMatched = 0;

    for (const { dbAbility, parsed: parsedAbility } of matches) {
      const nextName = mergeTranslation(dbAbility.nameTranslations, 'en', parsedAbility.name);
      const nextDesc = mergeTranslation(dbAbility.descriptionTranslations, 'en', parsedAbility.description);
      await this.prismaService.heroAbility.update({
        where: { id: dbAbility.id },
        data: {
          nameTranslations: nextName as Prisma.InputJsonValue,
          descriptionTranslations: nextDesc as Prisma.InputJsonValue,
        },
      });
      abilitiesMatched++;
    }

    if (matches.length === 0 && parsed.abilities.length > 0) {
      this.logger.warn(
        `${parsed.codename}: ${parsed.abilities.length}개 Blizzard 능력 추출했지만 DB와 매칭 실패 (slot 수 불일치)`,
      );
    }

    return {
      codename: parsed.codename,
      matched: true,
      abilitiesMatched,
      abilitiesTotal: matchable.length,
    };
  }

  private matchAbilities(
    dbAbilities: ReadonlyArray<{
      id: number;
      slot: AbilitySlot;
      nameTranslations: unknown;
      descriptionTranslations: unknown;
    }>,
    parsedAbilities: readonly ParsedAbilityEn[],
  ): Array<{ dbAbility: (typeof dbAbilities)[number]; parsed: ParsedAbilityEn }> {
    if (parsedAbilities.length === 0) return [];

    // 1:1 매칭 가능한 경우
    if (parsedAbilities.length === dbAbilities.length) {
      return dbAbilities.map((dbAbility, idx) => ({ dbAbility, parsed: parsedAbilities[idx] }));
    }

    // Blizzard가 PRIMARY+SECONDARY를 1개 카드로 묶은 케이스 (대부분의 무기 영웅)
    if (
      parsedAbilities.length + 1 === dbAbilities.length &&
      dbAbilities[0]?.slot === 'PRIMARY' &&
      dbAbilities[1]?.slot === 'SECONDARY'
    ) {
      const [weapon, ...rest] = parsedAbilities;
      return [
        { dbAbility: dbAbilities[0], parsed: weapon },
        { dbAbility: dbAbilities[1], parsed: weapon },
        ...rest.map((parsed, idx) => ({ dbAbility: dbAbilities[idx + 2], parsed })),
      ];
    }

    return [];
  }
}
