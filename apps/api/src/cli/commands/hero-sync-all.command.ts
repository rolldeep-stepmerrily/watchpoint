import { Command, CommandRunner } from 'nest-commander';

import { BlizzardHeroKoScraper } from '../../scraper/blizzard';
import { HERO_REGISTRY } from '../hero-registry';

@Command({
  name: 'hero:sync:all',
  description: 'hero-registry에 등록된 모든 영웅을 Blizzard 한국어 페이지에서 순차 동기화합니다.',
})
export class HeroSyncAllCommand extends CommandRunner {
  constructor(private readonly scraper: BlizzardHeroKoScraper) {
    super();
  }

  async run(): Promise<void> {
    const codenames = Object.keys(HERO_REGISTRY);
    console.log(`${codenames.length}명 동기화 시작 (요청 간 ScraperHttpClient의 delay 적용)...`);

    const results: Array<{
      codename: string;
      ok: boolean;
      matched?: boolean;
      abilities?: number;
      error?: string;
    }> = [];

    for (const codename of codenames) {
      try {
        const result = await this.scraper.sync(codename);
        results.push({ codename, ok: true, matched: result.matched, abilities: result.abilitiesUpserted });
      } catch (error) {
        results.push({ codename, ok: false, error: (error as Error).message });
      }
    }

    console.log('동기화 결과:');
    console.table(results);
  }
}
