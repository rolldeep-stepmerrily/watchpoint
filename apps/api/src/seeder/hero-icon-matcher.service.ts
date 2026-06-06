import { PrismaService } from '@@db';
import type { AbilitySlot, HeroAbility, HeroPerk } from '@@prisma';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve as pathResolve } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';

import { BlizzardIconParser, type ParsedAbilityIcon, type ParsedPerkIcon } from '../scraper/blizzard';
import { ScraperHttpClient } from '../scraper/common';

import { HeroDiffLogger } from './hero-diff-logger.service';
import { ABILITY_ID_TO_SLOT } from './icon-overrides';

const BLIZZARD_HERO_BASE = 'https://overwatch.blizzard.com/ko-kr/heroes/';
const PUBLIC_ICONS_REL = '../web/public/icons/heroes';

/**
 * 일부 영웅은 codename과 Blizzard URL slug가 다름 (blizzard-hero.scraper.ts와 동일 매핑 유지).
 */
const CODENAME_TO_BLIZZARD_SLUG: Readonly<Record<string, string>> = {
  'd-va': 'dva',
};

/**
 * 1:1 순서 매칭에 사용. PASSIVE는 Blizzard 영문 페이지에 일반적으로 노출되지 않아 제외.
 */
const MATCH_SLOT_ORDER: readonly AbilitySlot[] = ['PRIMARY', 'SECONDARY', 'ABILITY_1', 'ABILITY_2', 'ULTIMATE'];

export interface DownloadResult {
  codename: string;
  matched: boolean;
  abilityMatched: number;
  abilityTotal: number;
  perkMatched: number;
  perkTotal: number;
  unmatchedAbilities: string[];
  unmatchedPerks: string[];
  extraAbilityIds: string[];
  skipped?: string;
}

@Injectable()
export class HeroIconMatcher {
  private readonly logger = new Logger(HeroIconMatcher.name);

  constructor(
    private readonly http: ScraperHttpClient,
    private readonly parser: BlizzardIconParser,
    private readonly prisma: PrismaService,
    private readonly diffLogger: HeroDiffLogger,
  ) {}

  async downloadFor(codename: string): Promise<DownloadResult> {
    const hero = await this.prisma.hero.findUnique({
      where: { codename },
      include: {
        abilities: { orderBy: [{ slot: 'asc' }, { order: 'asc' }] },
        perks: { orderBy: [{ tier: 'asc' }, { slot: 'asc' }] },
      },
    });

    if (!hero) {
      throw new Error(`Hero ${codename} not found in DB. seed first.`);
    }

    const slug = CODENAME_TO_BLIZZARD_SLUG[codename] ?? codename;
    const url = `${BLIZZARD_HERO_BASE}${slug}/`;
    const html = await this.http.fetchHtmlOrNullOnClientError(url);

    if (html === null) {
      return {
        codename,
        matched: false,
        abilityMatched: 0,
        abilityTotal: hero.abilities.length,
        perkMatched: 0,
        perkTotal: hero.perks.length,
        unmatchedAbilities: hero.abilities.map((a) => a.name),
        unmatchedPerks: hero.perks.map((p) => p.name),
        extraAbilityIds: [],
        skipped: `Blizzard EN page 4xx (likely KR-only: ${codename})`,
      };
    }

    const parsed = this.parser.parse(html);
    const abilityMatches = this.matchAbilities(hero.abilities, parsed.abilities, codename);
    const perks = await this.ensurePerks(codename, hero.id, hero.perks, parsed.perks);

    const result: DownloadResult = {
      codename,
      matched: true,
      abilityMatched: 0,
      abilityTotal: hero.abilities.length,
      perkMatched: 0,
      perkTotal: perks.length,
      unmatchedAbilities: [],
      unmatchedPerks: [],
      extraAbilityIds: parsed.abilities
        .filter((p) => !abilityMatches.some((m) => m.parsed.id === p.id))
        .map((p) => p.id),
    };

    for (const ability of hero.abilities) {
      const match = abilityMatches.find((m) => m.dbAbility.id === ability.id);

      if (!match) {
        result.unmatchedAbilities.push(ability.name);
        continue;
      }

      const relPath = this.abilityRelPath(codename, ability, match.parsed.url);
      await this.saveAndUpdate(match.parsed.url, relPath, {
        kind: 'ability',
        record: ability,
        blizzardId: match.parsed.id,
      });
      result.abilityMatched += 1;
    }

    for (const perk of perks) {
      const parsedPerk = parsed.perks.find((p) => p.tier === perk.tier && p.slot === perk.slot);

      if (!parsedPerk) {
        result.unmatchedPerks.push(perk.name);
        continue;
      }

      const relPath = this.perkRelPath(codename, perk, parsedPerk.url);
      await this.saveAndUpdate(parsedPerk.url, relPath, { kind: 'perk', record: perk });
      result.perkMatched += 1;
    }

    return result;
  }

  /**
   * 페이지에서 추출한 perks 중 DB에 없는 항목을 자동 시드.
   * - tier + slot 키로 upsert: 같은 자리에 다른 이름이 있으면 update, 없으면 create.
   * - 자동 시드 후 모든 perks를 다시 반환 (downloadFor가 iconUrl 매핑에 사용).
   */
  private async ensurePerks(
    codename: string,
    heroId: number,
    existingPerks: readonly HeroPerk[],
    parsedPerks: readonly ParsedPerkIcon[],
  ): Promise<HeroPerk[]> {
    if (parsedPerks.length === 0) {
      return [...existingPerks];
    }

    for (const parsed of parsedPerks) {
      const existing = existingPerks.find((p) => p.tier === parsed.tier && p.slot === parsed.slot);

      if (existing) {
        if (existing.name !== parsed.label || existing.description !== parsed.description) {
          await this.prisma.heroPerk.update({
            where: { id: existing.id },
            data: { name: parsed.label, description: parsed.description },
          });
          await this.diffLogger.perkUpdated(codename, heroId, existing, {
            tier: parsed.tier,
            slot: parsed.slot,
            name: parsed.label,
            description: parsed.description,
          });
        }
        continue;
      }

      const created = await this.prisma.heroPerk.create({
        data: {
          heroId,
          tier: parsed.tier,
          slot: parsed.slot,
          name: parsed.label,
          description: parsed.description,
        },
      });
      await this.diffLogger.perkAdded(codename, heroId, created);
    }

    for (const existing of existingPerks) {
      const stillPresent = parsedPerks.find((p) => p.tier === existing.tier && p.slot === existing.slot);
      if (!stillPresent) {
        await this.prisma.heroPerk.delete({ where: { id: existing.id } });
        await this.diffLogger.perkRemoved(codename, heroId, existing);
      }
    }

    return this.prisma.heroPerk.findMany({
      where: { heroId },
      orderBy: [{ tier: 'asc' }, { slot: 'asc' }],
    });
  }

  /**
   * (a) override 맵으로 id→slot 직접 매핑 우선
   * (b) override가 없으면 순서 기반 fallback:
   *     - matchable DB abilities (PASSIVE 제외, MATCH_SLOT_ORDER 순) vs parsed abilities를 인덱스로 매칭
   *     - parsed.length + 1 === db.length & PRIMARY+SECONDARY가 동일 무기인 영웅 → 첫 카드를 두 슬롯에 매핑
   *     - parsed.length > matchable.length → 마지막 카드(들)를 drop하고 매칭 시도. PASSIVE/모드 ability가
   *       페이지 끝에 오는 일반 패턴(Echo의 Glide, Juno의 Martian Overboots 등)을 처리.
   *       단 마지막에 ULTIMATE가 오는 영웅(Mercy의 Valkyrie 등)은 잘못 매칭되므로 override 필수.
   *       warn 로그로 검증 대상임을 알림.
   */
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: override + 카드 수 케이스별 분기가 한 함수에 모여있어야 매칭 알고리즘 흐름을 따라가기 쉬움. 분할 시 케이스 점프로 인지 부하 증가.
  private matchAbilities(
    dbAbilities: readonly HeroAbility[],
    parsedAbilities: readonly ParsedAbilityIcon[],
    codename: string,
  ): Array<{ dbAbility: HeroAbility; parsed: ParsedAbilityIcon }> {
    const overrides = ABILITY_ID_TO_SLOT[codename];

    if (overrides) {
      const matches: Array<{ dbAbility: HeroAbility; parsed: ParsedAbilityIcon }> = [];
      const dbBySlot = new Map<AbilitySlot, HeroAbility[]>();
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

    if (parsedAbilities.length === 0 || matchable.length === 0) {
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

    if (parsedAbilities.length > matchable.length) {
      const dropCount = parsedAbilities.length - matchable.length;
      const trimmed = parsedAbilities.slice(0, matchable.length);
      this.logger.warn(
        `${codename}: parsed(${parsedAbilities.length}) > matchable(${matchable.length}). ` +
          `마지막 ${dropCount}개 카드 무시 후 매칭. UI 검증 후 잘못된 영웅은 override 필요.`,
      );

      return matchable.map((dbAbility, idx) => ({ dbAbility, parsed: trimmed[idx] }));
    }

    this.logger.warn(
      `${codename}: ability 매칭 실패 — DB matchable=${matchable.length}, parsed=${parsedAbilities.length}. override 필요.`,
    );

    return [];
  }

  private abilityRelPath(codename: string, ability: HeroAbility, url: string): string {
    const ext = this.extensionOf(url);

    return `${codename}/abilities/${ability.slot.toLowerCase()}.${ext}`;
  }

  private perkRelPath(codename: string, perk: HeroPerk, url: string): string {
    const ext = this.extensionOf(url);

    return `${codename}/perks/${perk.tier.toLowerCase()}-${perk.slot}.${ext}`;
  }

  private async saveAndUpdate(
    url: string,
    relPath: string,
    target: { kind: 'ability'; record: HeroAbility; blizzardId: string } | { kind: 'perk'; record: HeroPerk },
  ): Promise<void> {
    const { bytes } = await this.http.fetchBytes(url);
    const absPath = pathResolve(process.cwd(), PUBLIC_ICONS_REL, relPath);
    await mkdir(dirname(absPath), { recursive: true });
    await writeFile(absPath, bytes);
    this.logger.log(`saved ${relPath} (${bytes.byteLength} bytes)`);

    const iconUrl = `/icons/heroes/${relPath}`;

    if (target.kind === 'ability') {
      await this.prisma.heroAbility.update({
        where: { id: target.record.id },
        data: { iconUrl, blizzardId: target.blizzardId },
      });

      return;
    }

    await this.prisma.heroPerk.update({ where: { id: target.record.id }, data: { iconUrl } });
  }

  private extensionOf(url: string): string {
    const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);

    return (match?.[1] ?? 'png').toLowerCase();
  }
}
