import { ResponseCache } from '@@cache';
import { PrismaService } from '@@db';
import { type AbilitySlot, Prisma, ScrapeSource } from '@@prisma';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';

import { HeroDiffLogger } from '../../seeder';
import { ABILITY_ID_TO_SLOT } from '../../seeder/icon-overrides';
import { ScrapeJobRecorder, ScraperHttpClient } from '../common';
import { BlizzardHeroParser } from './blizzard-hero.parser';
import type { ParsedAbilityEn, ParsedHeroEn } from './dto/parsed-hero-en.dto';

const BLIZZARD_HERO_KO_BASE = 'https://overwatch.blizzard.com/ko-kr/heroes/';

/**
 * 일부 영웅은 codename과 Blizzard URL slug가 다름. en scraper와 동일 보정값 공유.
 */
const CODENAME_TO_BLIZZARD_SLUG: Readonly<Record<string, string>> = {
  'd-va': 'dva',
};

/**
 * Blizzard 영문 페이지가 PRIMARY+SECONDARY를 한 카드로 묶듯, 한국어 페이지도 동일하므로 같은 정렬 사용.
 */
const MATCH_SLOT_ORDER: readonly AbilitySlot[] = ['PRIMARY', 'SECONDARY', 'ABILITY_1', 'ABILITY_2', 'ULTIMATE'];

/**
 * 슬롯별 기본 입력 키. DB의 51명 통계 기준 압도적 다수가 이 매핑을 따른다.
 * 예외(Tracer recall / Genji swift-strike 등)는 ABILITY_KEY_OVERRIDES로.
 */
const DEFAULT_KEY_BY_SLOT: Readonly<Record<AbilitySlot, string | null>> = {
  PRIMARY: '좌클릭',
  SECONDARY: '우클릭',
  ABILITY_1: 'Shift',
  ABILITY_2: 'E',
  ULTIMATE: 'Q',
  PASSIVE: null,
};

const ABILITY_KEY_OVERRIDES: Readonly<Record<string, Partial<Record<AbilitySlot, string>>>> = {
  genji: { ABILITY_1: 'Space' },
  pharah: { ABILITY_1: 'Space' },
  tracer: { ABILITY_1: '아무 키' },
};

interface SyncResult {
  codename: string;
  matched: boolean;
  abilitiesUpserted: number;
  abilitiesParsed: number;
  abilitiesPreserved: number;
}

/**
 * Blizzard 한국어 영웅 페이지를 진실의 단일 소스로 사용해 한국어 이름/설명/능력 목록을 갱신한다.
 * - hero.name / hero.description: 한국어 페이지 헤더에서 직접 갱신
 * - hero_abilities: (slot, order) 기준 upsert. 기존 ability의 stats/key를 보존하면서
 *   name/description/blizzardId만 Blizzard 페이지 값으로 갱신. 매핑 안 된 기존 ability(예: Freja PRIMARY
 *   석궁처럼 Blizzard 페이지에 카드 없는 슬롯)는 그대로 유지.
 * - slot 결정: ABILITY_ID_TO_SLOT 우선, 미정 영웅은 MATCH_SLOT_ORDER 1:1 fallback.
 * - blizzardId 자동 저장 → 영문 sync는 이 id로 안전하게 다국어 매칭.
 * - ability.key는 기존 값을 보존(=create 시에만 DEFAULT_KEY_BY_SLOT 기본값 + ABILITY_KEY_OVERRIDES).
 * - perks는 이 scraper 책임 아님 (시드에서 별도 관리).
 */
@Injectable()
export class BlizzardHeroKoScraper {
  private readonly logger = new Logger(BlizzardHeroKoScraper.name);

  constructor(
    private readonly httpClient: ScraperHttpClient,
    private readonly parser: BlizzardHeroParser,
    private readonly recorder: ScrapeJobRecorder,
    private readonly prismaService: PrismaService,
    private readonly responseCache: ResponseCache,
    @Inject(forwardRef(() => HeroDiffLogger))
    private readonly diffLogger: HeroDiffLogger,
  ) {}

  async sync(codename: string): Promise<SyncResult> {
    const slug = CODENAME_TO_BLIZZARD_SLUG[codename] ?? codename;
    const url = `${BLIZZARD_HERO_KO_BASE}${slug}/`;

    const result = await this.recorder.run({
      source: ScrapeSource.BLIZZARD_HERO_KO,
      target: url,
      task: async () => {
        const html = await this.httpClient.fetchHtmlOrNullOnClientError(url);
        if (html === null) {
          const summary: SyncResult = {
            codename,
            matched: false,
            abilitiesUpserted: 0,
            abilitiesParsed: 0,
            abilitiesPreserved: 0,
          };
          return {
            result: summary,
            diffSummary: { ...summary },
            skipped: { reason: `Blizzard KO page 4xx for ${codename}` },
          };
        }
        const parsed = this.parser.parse(html, codename, url);
        const summary = await this.apply(parsed);
        return { result: summary, diffSummary: { ...summary } };
      },
    });
    if (result.matched) {
      await this.responseCache.invalidateAll();
    }
    return result;
  }

  private async apply(parsed: ParsedHeroEn): Promise<SyncResult> {
    const hero = await this.prismaService.hero.findUnique({
      where: { codename: parsed.codename },
      select: { id: true },
    });
    if (!hero) {
      this.logger.warn(`${parsed.codename}: hero row 없음 — catalog seed가 먼저 실행됐는지 확인 필요`);
      return {
        codename: parsed.codename,
        matched: false,
        abilitiesUpserted: 0,
        abilitiesParsed: parsed.abilities.length,
        abilitiesPreserved: 0,
      };
    }

    await this.prismaService.hero.update({
      where: { id: hero.id },
      data: {
        name: parsed.name,
        description: parsed.description,
        sourceUrl: parsed.sourceUrl,
      },
    });

    if (parsed.abilities.length === 0) {
      this.logger.warn(`${parsed.codename}: ability 카드 0개 — 페이지 구조 변경 가능성`);
      return {
        codename: parsed.codename,
        matched: true,
        abilitiesUpserted: 0,
        abilitiesParsed: 0,
        abilitiesPreserved: 0,
      };
    }

    const slotted = this.assignSlots(parsed.codename, parsed.abilities);
    if (slotted.length === 0) {
      this.logger.warn(`${parsed.codename}: ${parsed.abilities.length}개 카드를 DB slot에 매핑 실패`);
      return {
        codename: parsed.codename,
        matched: true,
        abilitiesUpserted: 0,
        abilitiesParsed: parsed.abilities.length,
        abilitiesPreserved: 0,
      };
    }

    const before = await this.prismaService.heroAbility.findMany({
      where: { heroId: hero.id },
      orderBy: [{ slot: 'asc' }, { order: 'asc' }],
    });
    const beforeBySlotOrder = new Map(before.map((a) => [`${a.slot}#${a.order}`, a]));
    const matchedKeys = new Set<string>();

    const keyOverride = ABILITY_KEY_OVERRIDES[parsed.codename] ?? {};
    let upserted = 0;
    for (const { slot, order, parsed: ability } of slotted) {
      const key = `${slot}#${order}`;
      matchedKeys.add(key);
      const existing = beforeBySlotOrder.get(key);
      if (existing) {
        await this.prismaService.heroAbility.update({
          where: { id: existing.id },
          data: {
            name: ability.name,
            description: ability.description,
            blizzardId: ability.id,
          },
        });
      } else {
        await this.prismaService.heroAbility.create({
          data: {
            heroId: hero.id,
            slot,
            order,
            key: keyOverride[slot] ?? DEFAULT_KEY_BY_SLOT[slot],
            name: ability.name,
            description: ability.description,
            blizzardId: ability.id,
            stats: Prisma.JsonNull,
          },
        });
      }
      upserted++;
    }
    const preserved = before.filter((a) => !matchedKeys.has(`${a.slot}#${a.order}`)).length;

    await this.diffLogger.diffAbilities(
      parsed.codename,
      hero.id,
      before,
      slotted.map(({ slot, order, parsed: ability }) => {
        const existing = beforeBySlotOrder.get(`${slot}#${order}`);
        return {
          slot,
          order,
          name: ability.name,
          description: ability.description,
          stats: (existing?.stats as Prisma.JsonValue | undefined) ?? null,
        };
      }),
    );

    return {
      codename: parsed.codename,
      matched: true,
      abilitiesUpserted: upserted,
      abilitiesParsed: parsed.abilities.length,
      abilitiesPreserved: preserved,
    };
  }

  /**
   * 카드별 DB slot 결정.
   * 1순위: ABILITY_ID_TO_SLOT override (영웅별 명시 매핑).
   * 2순위: MATCH_SLOT_ORDER 1:1 (PRIMARY/SECONDARY/ABILITY_1/ABILITY_2/ULTIMATE).
   *        카드 수가 5개 미만이면 앞쪽 슬롯부터 채우고 나머지는 누락 처리.
   * PASSIVE 카드는 override에서만 매핑.
   */
  private assignSlots(
    codename: string,
    parsedAbilities: readonly ParsedAbilityEn[],
  ): Array<{ slot: AbilitySlot; order: number; parsed: ParsedAbilityEn }> {
    const overrides = ABILITY_ID_TO_SLOT[codename];

    if (overrides) {
      const orderBySlot = new Map<AbilitySlot, number>();
      const result: Array<{ slot: AbilitySlot; order: number; parsed: ParsedAbilityEn }> = [];
      for (const parsed of parsedAbilities) {
        const mapping = overrides[parsed.id];
        if (!mapping) {
          this.logger.warn(`${codename}: 카드 "${parsed.id}" override 누락 — slot 결정 실패, 건너뜀`);
          continue;
        }
        const targetSlots = Array.isArray(mapping) ? mapping : [mapping];
        for (const slot of targetSlots) {
          const order = orderBySlot.get(slot) ?? 0;
          result.push({ slot, order, parsed });
          orderBySlot.set(slot, order + 1);
        }
      }
      return result;
    }

    const fallbackSlots = MATCH_SLOT_ORDER.slice(0, parsedAbilities.length);
    return fallbackSlots.map((slot, idx) => ({ slot, order: 0, parsed: parsedAbilities[idx] }));
  }
}
