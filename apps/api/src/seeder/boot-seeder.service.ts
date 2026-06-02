import { PrismaService } from '@@db';
import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { HeroIconMatcher } from './hero-icon-matcher.service';

const PERKS_PER_HERO = 4;

/**
 * 부트 시 perks 시드/아이콘 매칭이 부족하면 백그라운드로 자동 보강.
 *
 * - `AUTO_SEED_ON_BOOT=true`일 때만 활성. 기본 false (prod에서 명시적 opt-in)
 * - 트리거: hero count > 0 & perk count < hero count × 4
 * - 백그라운드 실행 (await 안 함) — 부팅 즉시 완료, 헬스체크 안전
 * - 매처가 upsert + 위치 기반 매칭이라 idempotent. 재실행해도 안전
 * - Blizzard CDN throttle(2초)로 51명 ≈ 17분 소요
 */
@Injectable()
export class BootSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BootSeederService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly matcher: HeroIconMatcher,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const enabled = this.configService.get<string>('AUTO_SEED_ON_BOOT') === 'true';

    if (!enabled) {
      return;
    }

    const heroCount = await this.prisma.hero.count();

    if (heroCount === 0) {
      this.logger.warn('auto-seed skip: hero count = 0 (영웅 시드 먼저 필요)');

      return;
    }

    const perkCount = await this.prisma.heroPerk.count();
    const expected = heroCount * PERKS_PER_HERO;

    if (perkCount >= expected) {
      this.logger.log(`auto-seed skip: perks ${perkCount} >= expected ${expected}`);

      return;
    }

    this.logger.warn(`auto-seed start (background): perks ${perkCount} < expected ${expected}, heroes=${heroCount}`);

    void this.runSeed().catch((error) => {
      this.logger.error(`auto-seed failed: ${(error as Error).message}`, (error as Error).stack);
    });
  }

  private async runSeed(): Promise<void> {
    const heroes = await this.prisma.hero.findMany({
      select: { codename: true },
      orderBy: { codename: 'asc' },
    });

    let okCount = 0;
    let failCount = 0;

    for (const { codename } of heroes) {
      try {
        const result = await this.matcher.downloadFor(codename);
        this.logger.log(
          `auto-seed ${codename}: abil=${result.abilityMatched}/${result.abilityTotal} perks=${result.perkMatched}/${result.perkTotal}${result.skipped ? ` [${result.skipped}]` : ''}`,
        );
        okCount += 1;
      } catch (error) {
        this.logger.warn(`auto-seed ${codename} failed: ${(error as Error).message}`);
        failCount += 1;
      }
    }

    this.logger.log(`auto-seed complete: ok=${okCount} fail=${failCount} / ${heroes.length}`);
  }
}
