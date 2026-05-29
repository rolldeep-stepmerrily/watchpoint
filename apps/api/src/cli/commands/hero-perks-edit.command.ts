import { ResponseCache } from '@@cache';
import { PrismaService } from '@@db';
import { PerkTier, Prisma } from '@@prisma';
import { Command, CommandRunner, Option } from 'nest-commander';

interface HeroPerksEditOptions {
  tier?: PerkTier;
  slot?: number;
  name?: string;
  description?: string;
  stats?: Prisma.InputJsonValue;
  iconUrl?: string | null;
  clearIcon?: boolean;
  clearStats?: boolean;
}

interface ResolvedHero {
  id: number;
  perks: ReadonlyArray<{ tier: PerkTier; slot: number; name: string; description: string }>;
}

@Command({
  name: 'hero:perks:edit',
  arguments: '<codename>',
  description: '영웅 특전(MINOR/MAJOR × slot 1/2)을 upsert합니다. 옵션 없이 호출하면 현재 특전 조회.',
})
export class HeroPerksEditCommand extends CommandRunner {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly responseCache: ResponseCache,
  ) {
    super();
  }

  async run(inputs: string[], options: HeroPerksEditOptions): Promise<void> {
    const [codename] = inputs;
    if (!codename) {
      this.fail('codename 필요: pnpm hero:perks:edit <codename> [--tier MINOR|MAJOR --slot 1|2 ...]');
    }

    const hero = await this.findHero(codename);

    if (!(options.tier || options.slot)) {
      this.printCurrent(codename, hero.perks);
      return;
    }

    const { tier, slot } = this.requireTierSlot(options);
    await this.upsertPerk(codename, hero.id, tier, slot, options);
  }

  private async findHero(codename: string): Promise<ResolvedHero> {
    const hero = await this.prismaService.hero.findUnique({
      where: { codename },
      include: { perks: { orderBy: [{ tier: 'asc' }, { slot: 'asc' }] } },
    });
    if (!hero) {
      this.fail(`영웅 ${codename}을(를) 찾을 수 없습니다. hero:sync로 먼저 추가하세요.`);
    }
    return hero;
  }

  private printCurrent(codename: string, perks: ResolvedHero['perks']): void {
    if (perks.length === 0) {
      console.log(`${codename}에 등록된 특전이 없습니다.`);
    } else {
      console.log(`${codename} 특전 ${perks.length}개:`);
      for (const perk of perks) {
        console.log(`  [${perk.tier}/${perk.slot}] ${perk.name} — ${perk.description.slice(0, 80)}`);
      }
    }
    console.log(
      '수정: --tier MINOR|MAJOR --slot 1|2 --name <text> --description <text> [--stats <json>] [--icon-url <url>]',
    );
  }

  private requireTierSlot(options: HeroPerksEditOptions): { tier: PerkTier; slot: 1 | 2 } {
    if (!(options.tier && options.slot)) {
      this.fail('--tier 와 --slot 은 함께 지정해야 합니다');
    }
    if (options.slot !== 1 && options.slot !== 2) {
      this.fail('--slot 은 1 또는 2');
    }
    return { tier: options.tier, slot: options.slot };
  }

  private async upsertPerk(
    codename: string,
    heroId: number,
    tier: PerkTier,
    slot: 1 | 2,
    options: HeroPerksEditOptions,
  ): Promise<void> {
    const where = { heroId_tier_slot: { heroId, tier, slot } } satisfies Prisma.HeroPerkWhereUniqueInput;
    const existing = await this.prismaService.heroPerk.findUnique({ where });

    if (!(existing || (options.name && options.description))) {
      this.fail('신규 특전 생성에는 --name 과 --description 모두 필요합니다');
    }

    const upserted = existing
      ? await this.prismaService.heroPerk.update({ where, data: this.buildUpdateData(options) })
      : await this.prismaService.heroPerk.create({
          data: {
            heroId,
            tier,
            slot,
            name: options.name as string,
            description: options.description as string,
            stats: options.stats,
            iconUrl: options.iconUrl ?? null,
          },
        });

    await this.responseCache.invalidateAll();
    console.log(
      `${codename} [${upserted.tier}/${upserted.slot}] ${existing ? '수정' : '생성'} 완료: ${upserted.name}`,
    );
  }

  private buildUpdateData(options: HeroPerksEditOptions): Prisma.HeroPerkUpdateInput {
    const data: Prisma.HeroPerkUpdateInput = {};
    if (options.name !== undefined) data.name = options.name;
    if (options.description !== undefined) data.description = options.description;
    if (options.stats !== undefined) data.stats = options.stats;
    if (options.clearStats) data.stats = Prisma.JsonNull;
    if (options.iconUrl !== undefined) data.iconUrl = options.iconUrl;
    if (options.clearIcon) data.iconUrl = null;
    return data;
  }

  private fail(message: string): never {
    console.error(message);
    process.exit(1);
  }

  @Option({ flags: '--tier <tier>', description: 'MINOR | MAJOR' })
  parseTier(value: string): PerkTier {
    const upper = value.toUpperCase();
    if (upper !== 'MINOR' && upper !== 'MAJOR') {
      throw new Error(`tier는 MINOR 또는 MAJOR (입력: ${value})`);
    }
    return upper;
  }

  @Option({ flags: '--slot <slot>', description: '1 또는 2 (같은 tier 내 선택지)' })
  parseSlot(value: string): number {
    return Number.parseInt(value, 10);
  }

  @Option({ flags: '--name <name>', description: '특전 이름 (한국어)' })
  parseName(value: string): string {
    return value;
  }

  @Option({ flags: '--description <text>', description: '특전 본문 (한국어)' })
  parseDescription(value: string): string {
    return value;
  }

  @Option({ flags: '--stats <json>', description: 'JSON 문자열, 예: \'{"공격력": "35"}\'' })
  parseStats(value: string): Prisma.InputJsonValue {
    try {
      return JSON.parse(value) as Prisma.InputJsonValue;
    } catch (error) {
      throw new Error(`--stats JSON 파싱 실패: ${(error as Error).message}`);
    }
  }

  @Option({ flags: '--icon-url <url>', description: '아이콘 URL (이미지 자체 호스팅 도입 전까지 임시)' })
  parseIconUrl(value: string): string {
    return value;
  }

  @Option({ flags: '--clear-stats', description: 'stats를 NULL로 초기화' })
  parseClearStats(): boolean {
    return true;
  }

  @Option({ flags: '--clear-icon', description: 'iconUrl을 NULL로 초기화' })
  parseClearIcon(): boolean {
    return true;
  }
}
