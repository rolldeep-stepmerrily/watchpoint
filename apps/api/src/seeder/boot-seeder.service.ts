import { PrismaService } from '@@db';
import { forwardRef, Inject, Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { BlizzardHeroEnScraper, BlizzardHeroKoScraper } from '../scraper/blizzard';
import { HeroIconMatcher } from './hero-icon-matcher.service';

const PERKS_PER_HERO = 4;

/**
 * 부트 시 한국어/영문 데이터 + 아이콘이 부족하면 백그라운드로 전체 보강.
 *
 * - `AUTO_SEED_ON_BOOT=true`일 때만 활성.
 * - 트리거: hero count > 0 & perk count < hero count × 4 (= 빈 prod DB 첫 부팅 시점)
 * - 4 phase 순차:
 *   1. 한국어 sync (ability name/description + blizzardId 채움)
 *   2. 영문 sync (영문 nameTranslations/descriptionTranslations)
 *   3. portrait 다운로드 (자체 호스팅 path)
 *   4. ability/perk 아이콘 다운로드
 * - 백그라운드 실행 — 부팅 즉시 완료, 헬스체크 안전
 * - 모든 sync는 upsert + 위치 기반이라 idempotent. 재실행해도 안전
 * - Blizzard CDN throttle(2초)로 51명 × 4 phase ≈ 25분 소요
 */
@Injectable()
export class BootSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BootSeederService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => HeroIconMatcher))
    private readonly matcher: HeroIconMatcher,
    @Inject(forwardRef(() => BlizzardHeroKoScraper))
    private readonly koScraper: BlizzardHeroKoScraper,
    @Inject(forwardRef(() => BlizzardHeroEnScraper))
    private readonly enScraper: BlizzardHeroEnScraper,
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

    this.runSeed().catch((error: unknown) => {
      this.logger.error(`auto-seed failed: ${(error as Error).message}`, (error as Error).stack);
    });
  }

  private async runSeed(): Promise<void> {
    const heroes = await this.prisma.hero.findMany({
      select: { codename: true },
      orderBy: { codename: 'asc' },
    });
    const codenames = heroes.map((h) => h.codename);

    await this.runPhase('ko-sync', codenames, (cn) => this.koScraper.sync(cn));
    await this.runPhase('en-sync', codenames, (cn) => this.enScraper.sync(cn));
    await this.runPhase('portrait', codenames, (cn) => this.matcher.downloadPortraitFor(cn));
    await this.runPhase('icons', codenames, (cn) => this.matcher.downloadFor(cn));

    this.logger.log('auto-seed all phases complete');
  }

  private async runPhase(
    phase: string,
    codenames: readonly string[],
    task: (cn: string) => Promise<unknown>,
  ): Promise<void> {
    let ok = 0;
    let fail = 0;
    this.logger.log(`auto-seed phase=${phase} start (${codenames.length} heroes)`);
    for (const codename of codenames) {
      try {
        await task(codename);
        ok++;
      } catch (error) {
        this.logger.warn(`auto-seed phase=${phase} ${codename} failed: ${(error as Error).message}`);
        fail++;
      }
    }
    this.logger.log(`auto-seed phase=${phase} done ok=${ok} fail=${fail}`);
  }
}
