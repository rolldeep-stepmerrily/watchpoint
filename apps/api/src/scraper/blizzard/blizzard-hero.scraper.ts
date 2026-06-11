import { ResponseCache } from '@@cache';
import { PrismaService } from '@@db';
import { type AbilitySlot, Prisma, ScrapeSource } from '@@prisma';
import { Injectable, Logger } from '@nestjs/common';

import { ABILITY_ID_TO_SLOT } from '../../seeder/icon-overrides';
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
  perksMatched: number;
  perksTotal: number;
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
          const summary: SyncResult = {
            codename,
            matched: false,
            abilitiesMatched: 0,
            abilitiesTotal: 0,
            perksMatched: 0,
            perksTotal: 0,
          };
          return {
            result: summary,
            diffSummary: { ...summary },
            skipped: { reason: `Blizzard EN page 4xx (likely KR-only hero: ${codename})` },
          };
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
   * Perk는 (tier, slot) 1:1 직접 매칭으로 영문 translation 병합.
   */
  private async applyTranslations(parsed: ParsedHeroEn): Promise<SyncResult> {
    const hero = await this.prismaService.hero.findUnique({
      where: { codename: parsed.codename },
      select: {
        id: true,
        nameTranslations: true,
        descriptionTranslations: true,
        abilities: {
          select: {
            id: true,
            slot: true,
            order: true,
            name: true,
            blizzardId: true,
            nameTranslations: true,
            descriptionTranslations: true,
          },
        },
        perks: {
          select: {
            id: true,
            tier: true,
            slot: true,
            nameTranslations: true,
            descriptionTranslations: true,
          },
        },
      },
    });
    if (!hero) {
      return {
        codename: parsed.codename,
        matched: false,
        abilitiesMatched: 0,
        abilitiesTotal: 0,
        perksMatched: 0,
        perksTotal: 0,
      };
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

    const matches = this.matchAbilities(hero.abilities, parsed.abilities, parsed.codename);
    this.warnSuspiciousMatches(parsed.codename, matches);

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

    const perksMatched = await this.applyPerkTranslations(parsed, hero.perks);

    return {
      codename: parsed.codename,
      matched: true,
      abilitiesMatched,
      abilitiesTotal: hero.abilities.length,
      perksMatched,
      perksTotal: hero.perks.length,
    };
  }

  /**
   * Perk는 (tier, slot) 복합키가 명확해 매칭 로직이 단순하다.
   * Blizzard 영문 페이지의 perk-details는 `left|right` × `minor|major` = 최대 4개.
   * left → slot 1, right → slot 2, minor → MINOR, major → MAJOR로 직접 매핑.
   */
  private async applyPerkTranslations(
    parsed: ParsedHeroEn,
    dbPerks: ReadonlyArray<{
      id: number;
      tier: 'MINOR' | 'MAJOR';
      slot: number;
      nameTranslations: unknown;
      descriptionTranslations: unknown;
    }>,
  ): Promise<number> {
    if (parsed.perks.length === 0) {
      return 0;
    }

    const dbByKey = new Map(dbPerks.map((p) => [`${p.tier}#${p.slot}`, p]));
    let matched = 0;

    for (const p of parsed.perks) {
      const key = `${p.tier}#${p.slot}`;
      const existing = dbByKey.get(key);
      if (!existing) {
        this.logger.warn(`${parsed.codename}: perk ${key} DB row 없음 — seed가 부족할 가능성`);
        continue;
      }
      const nextName = mergeTranslation(existing.nameTranslations, 'en', p.name);
      const nextDesc = mergeTranslation(existing.descriptionTranslations, 'en', p.description);
      await this.prismaService.heroPerk.update({
        where: { id: existing.id },
        data: {
          nameTranslations: nextName as Prisma.InputJsonValue,
          descriptionTranslations: nextDesc as Prisma.InputJsonValue,
        },
      });
      matched++;
    }
    return matched;
  }

  /**
   * 매칭된 능력 중 parsed.name이 비정상(빈값/2자 미만)이거나 KR name보다 현저히 짧으면 경고.
   * Blizzard 영문 페이지의 카드 순서가 DB MATCH_SLOT_ORDER와 어긋났을 가능성 신호.
   */
  private warnSuspiciousMatches(
    codename: string,
    matches: ReadonlyArray<{ dbAbility: { slot: AbilitySlot; name: string }; parsed: ParsedAbilityEn }>,
  ): void {
    const suspicious = matches.filter(({ dbAbility, parsed }) => {
      const enName = parsed.name?.trim() ?? '';
      if (enName.length < 2) {
        return true;
      }
      if (dbAbility.name.length > 0 && enName.length < dbAbility.name.length / 2) {
        return true;
      }
      return false;
    });
    if (suspicious.length === 0) {
      return;
    }

    this.logger.warn(
      `${codename}: ${suspicious.length}개 능력 매칭 의심 — Blizzard 카드 순서가 MATCH_SLOT_ORDER와 어긋났을 수 있음`,
    );
    for (const { dbAbility, parsed } of suspicious) {
      this.logger.warn(`  slot=${dbAbility.slot}: db="${dbAbility.name}" ↔ parsed="${parsed.name ?? ''}"`);
    }
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: 3단계 매칭(blizzardId → override → 1:1 fallback)이 한 흐름. 분할 시 흐름 가독성 떨어짐.
  private matchAbilities(
    dbAbilities: ReadonlyArray<{
      id: number;
      slot: AbilitySlot;
      order: number;
      name: string;
      blizzardId: string | null;
      nameTranslations: unknown;
      descriptionTranslations: unknown;
    }>,
    parsedAbilities: readonly ParsedAbilityEn[],
    codename: string,
  ): Array<{ dbAbility: (typeof dbAbilities)[number]; parsed: ParsedAbilityEn }> {
    if (parsedAbilities.length === 0) {
      return [];
    }

    // 1차: blizzardId 매칭 — 한국어 sync 시 ability.blizzardId가 채워지므로
    // 영웅별 override 없이도 안전하게 다국어 데이터를 연결할 수 있다.
    // 동일 blizzardId가 여러 ability에 매핑되는 케이스(Moira biotic-grasp = PRIMARY+SECONDARY)도 처리.
    const idMatches: Array<{ dbAbility: (typeof dbAbilities)[number]; parsed: ParsedAbilityEn }> = [];
    for (const parsed of parsedAbilities) {
      for (const dbAbility of dbAbilities) {
        if (dbAbility.blizzardId && dbAbility.blizzardId === parsed.id) {
          idMatches.push({ dbAbility, parsed });
        }
      }
    }
    if (idMatches.length > 0) {
      return idMatches;
    }

    // 2차: ABILITY_ID_TO_SLOT override — blizzardId가 아직 채워지지 않은 환경(prod 첫 부팅 등) 대비.
    const overrides = ABILITY_ID_TO_SLOT[codename];

    if (overrides) {
      const matches: Array<{ dbAbility: (typeof dbAbilities)[number]; parsed: ParsedAbilityEn }> = [];
      const dbBySlot = new Map<AbilitySlot, Array<(typeof dbAbilities)[number]>>();
      for (const a of dbAbilities) {
        const arr = dbBySlot.get(a.slot) ?? [];
        arr.push(a);
        dbBySlot.set(a.slot, arr);
      }
      for (const parsed of parsedAbilities) {
        const mapping = overrides[parsed.id];
        if (!mapping) {
          continue;
        }
        const targetSlots = Array.isArray(mapping) ? mapping : [mapping];
        for (const targetSlot of targetSlots) {
          const slotAbilities = dbBySlot.get(targetSlot);
          const dbAbility = slotAbilities?.shift();
          if (dbAbility) {
            matches.push({ dbAbility, parsed });
          }
        }
      }
      return matches;
    }

    const matchable = dbAbilities
      .filter((a) => MATCH_SLOT_ORDER.includes(a.slot))
      .sort((a, b) => MATCH_SLOT_ORDER.indexOf(a.slot) - MATCH_SLOT_ORDER.indexOf(b.slot) || a.order - b.order);

    if (matchable.length === 0) {
      return [];
    }

    if (parsedAbilities.length === matchable.length) {
      return matchable.map((dbAbility, idx) => ({ dbAbility, parsed: parsedAbilities[idx] }));
    }

    if (
      parsedAbilities.length + 1 === matchable.length &&
      matchable[0]?.slot === 'PRIMARY' &&
      matchable[1]?.slot === 'SECONDARY'
    ) {
      const [weapon, ...rest] = parsedAbilities;
      return [
        { dbAbility: matchable[0], parsed: weapon },
        { dbAbility: matchable[1], parsed: weapon },
        ...rest.map((parsed, idx) => ({ dbAbility: matchable[idx + 2], parsed })),
      ];
    }

    return [];
  }
}
