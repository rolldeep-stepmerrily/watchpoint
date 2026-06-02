import { PrismaService } from '@@db';
import { type HeroAbility, type HeroChangeType, type HeroPerk, type HeroStat, Prisma } from '@@prisma';
import { Injectable, Logger } from '@nestjs/common';

/**
 * 자동 sync 시 발견된 변경 사항을 console + hero_change_logs DB에 기록.
 * 디버그/추적용. 비즈니스 로직은 이 로그를 읽지 않음.
 */
@Injectable()
export class HeroDiffLogger {
  private readonly logger = new Logger(HeroDiffLogger.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * HeroStat 변경 비교. 각 필드(health/armor/shield/moveSpeed/extras)가 다르면 row 하나.
   */
  async diffStat(
    codename: string,
    heroId: number,
    before: HeroStat | null,
    after: { health: number; armor: number; shield: number; moveSpeed: number; extras: unknown },
    scrapeJobId?: number,
  ): Promise<void> {
    if (!before) {
      await this.write(
        heroId,
        scrapeJobId,
        'HERO_STAT_CHANGED',
        'stat',
        null,
        null,
        after,
        `${codename}: stat created`,
      );

      return;
    }

    for (const key of ['health', 'armor', 'shield', 'moveSpeed'] as const) {
      const b = before[key];
      const a = after[key];
      if (b !== a) {
        await this.write(heroId, scrapeJobId, 'HERO_STAT_CHANGED', 'stat', key, b, a, `${codename}: ${key} ${b}→${a}`);
      }
    }

    if (!equalJson(before.extras, after.extras)) {
      await this.write(
        heroId,
        scrapeJobId,
        'HERO_STAT_CHANGED',
        'stat',
        'extras',
        before.extras,
        after.extras as never,
        `${codename}: extras 변경`,
      );
    }
  }

  /**
   * abilities 비교. slot+order 키로 매칭.
   * 추가/삭제: ABILITY_ADDED / ABILITY_REMOVED
   * 이름/설명/stats 변경: 개별 row
   */
  async diffAbilities(
    codename: string,
    heroId: number,
    before: readonly HeroAbility[],
    after: ReadonlyArray<{ slot: string; order: number; name: string; description: string; stats: unknown }>,
    scrapeJobId?: number,
  ): Promise<void> {
    const beforeMap = new Map(before.map((a) => [`${a.slot}#${a.order}`, a]));
    const afterMap = new Map(after.map((a) => [`${a.slot}#${a.order}`, a]));

    for (const [key, a] of afterMap) {
      if (!beforeMap.has(key)) {
        await this.write(
          heroId,
          scrapeJobId,
          'ABILITY_ADDED',
          'ability',
          key,
          null,
          { name: a.name, description: a.description, stats: a.stats },
          `${codename}: ability 추가 ${key} "${a.name}"`,
        );
      }
    }

    for (const [key, b] of beforeMap) {
      const a = afterMap.get(key);
      if (!a) {
        await this.write(
          heroId,
          scrapeJobId,
          'ABILITY_REMOVED',
          'ability',
          key,
          { name: b.name, description: b.description, stats: b.stats },
          null,
          `${codename}: ability 삭제 ${key} "${b.name}"`,
        );
        continue;
      }
      if (b.name !== a.name) {
        await this.write(
          heroId,
          scrapeJobId,
          'ABILITY_NAME_CHANGED',
          'ability',
          key,
          b.name,
          a.name,
          `${codename}: ability ${key} 이름 "${b.name}"→"${a.name}"`,
        );
      }
      if (b.description !== a.description) {
        await this.write(
          heroId,
          scrapeJobId,
          'ABILITY_DESCRIPTION_CHANGED',
          'ability',
          key,
          b.description,
          a.description,
          `${codename}: ability ${key} 설명 변경`,
        );
      }
      if (!equalJson(b.stats, a.stats)) {
        await this.writeStatsDiff(codename, heroId, key, b.stats, a.stats, scrapeJobId);
      }
    }
  }

  /**
   * ability stats 안의 각 키별로 a→b 변경을 row로 남김.
   * 변경 없는 키는 skip.
   */
  private async writeStatsDiff(
    codename: string,
    heroId: number,
    abilityKey: string,
    before: unknown,
    after: unknown,
    scrapeJobId?: number,
  ): Promise<void> {
    const b = (before ?? {}) as Record<string, unknown>;
    const a = (after ?? {}) as Record<string, unknown>;
    const allKeys = new Set([...Object.keys(b), ...Object.keys(a)]);

    for (const k of allKeys) {
      if (!equalJson(b[k], a[k])) {
        await this.write(
          heroId,
          scrapeJobId,
          'ABILITY_STATS_CHANGED',
          'ability',
          `${abilityKey}.${k}`,
          b[k] ?? null,
          a[k] ?? null,
          `${codename}: ability ${abilityKey} stats.${k} ${formatVal(b[k])}→${formatVal(a[k])}`,
        );
      }
    }
  }

  /**
   * 단일 perk 변경 로그 — ensurePerks에서 create/update 시점에 호출.
   */
  async perkAdded(codename: string, heroId: number, perk: HeroPerk, scrapeJobId?: number): Promise<void> {
    await this.write(
      heroId,
      scrapeJobId,
      'PERK_ADDED',
      'perk',
      `${perk.tier}-${perk.slot}`,
      null,
      { name: perk.name, description: perk.description },
      `${codename}: perk 추가 ${perk.tier}-${perk.slot} "${perk.name}"`,
    );
  }

  async perkRemoved(codename: string, heroId: number, perk: HeroPerk, scrapeJobId?: number): Promise<void> {
    await this.write(
      heroId,
      scrapeJobId,
      'PERK_REMOVED',
      'perk',
      `${perk.tier}-${perk.slot}`,
      { name: perk.name, description: perk.description },
      null,
      `${codename}: perk 삭제 ${perk.tier}-${perk.slot} "${perk.name}"`,
    );
  }

  async perkUpdated(
    codename: string,
    heroId: number,
    before: HeroPerk,
    after: { tier: string; slot: number; name: string; description: string },
    scrapeJobId?: number,
  ): Promise<void> {
    const key = `${after.tier}-${after.slot}`;
    if (before.name !== after.name) {
      await this.write(
        heroId,
        scrapeJobId,
        'PERK_NAME_CHANGED',
        'perk',
        key,
        before.name,
        after.name,
        `${codename}: perk ${key} 이름 "${before.name}"→"${after.name}"`,
      );
    }
    if (before.description !== after.description) {
      await this.write(
        heroId,
        scrapeJobId,
        'PERK_DESCRIPTION_CHANGED',
        'perk',
        key,
        before.description,
        after.description,
        `${codename}: perk ${key} 설명 변경`,
      );
    }
  }

  private async write(
    heroId: number,
    scrapeJobId: number | undefined,
    changeType: HeroChangeType,
    target: string,
    targetKey: string | null,
    before: unknown,
    after: unknown,
    message: string,
  ): Promise<void> {
    this.logger.log(message);
    try {
      await this.prisma.heroChangeLog.create({
        data: {
          heroId,
          scrapeJobId: scrapeJobId ?? null,
          changeType,
          target,
          targetKey,
          before: toJson(before),
          after: toJson(after),
        },
      });
    } catch (error) {
      this.logger.warn(`change log persist failed: ${(error as Error).message}`);
    }
  }
}

function toJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === undefined || value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

function equalJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

function formatVal(v: unknown): string {
  if (v === undefined || v === null) {
    return '∅';
  }

  return typeof v === 'object' ? JSON.stringify(v) : String(v);
}
