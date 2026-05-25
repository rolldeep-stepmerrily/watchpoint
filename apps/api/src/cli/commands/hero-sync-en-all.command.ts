import { Command, CommandRunner } from 'nest-commander';

import { BlizzardHeroEnScraper } from '../../scraper/blizzard';
import { HERO_REGISTRY } from '../hero-registry';

@Command({
  name: 'hero:sync:en:all',
  description: 'hero-registry에 등록된 모든 영웅의 영문 이름/설명을 순차 보강합니다.',
})
export class HeroSyncEnAllCommand extends CommandRunner {
  constructor(private readonly scraper: BlizzardHeroEnScraper) {
    super();
  }

  async run(): Promise<void> {
    const codenames = Object.keys(HERO_REGISTRY);
    console.log(`${codenames.length}명 영문 보강 시작 (요청 간 ScraperHttpClient의 delay 적용)...`);

    const results: Array<{ codename: string; matched: boolean; error?: string }> = [];

    for (const codename of codenames) {
      try {
        const result = await this.scraper.sync(codename);
        results.push({ codename, matched: result.matched });
      } catch (error) {
        results.push({ codename, matched: false, error: (error as Error).message });
      }
    }

    console.log('보강 결과:');
    console.table(results);
    const ok = results.filter((r) => r.matched).length;
    console.log(`성공 ${ok}/${results.length}`);
  }
}
