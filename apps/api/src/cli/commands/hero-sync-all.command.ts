import { Command, CommandRunner } from 'nest-commander';

import { NamuwikiHeroScraper } from '../../scraper/namuwiki';
import { HERO_REGISTRY } from '../hero-registry';

@Command({
  name: 'hero:sync:all',
  description: 'hero-registry에 등록된 모든 영웅을 순차 동기화합니다.',
})
export class HeroSyncAllCommand extends CommandRunner {
  constructor(private readonly scraper: NamuwikiHeroScraper) {
    super();
  }

  async run(): Promise<void> {
    const entries = Object.entries(HERO_REGISTRY);
    console.log(`${entries.length}명 동기화 시작 (요청 간 ScraperHttpClient의 delay 적용)...`);

    const results: Array<{ codename: string; ok: boolean; abilities?: number; error?: string }> = [];

    for (const [codename, entry] of entries) {
      try {
        const result = await this.scraper.sync(codename, entry.pageTitle, {
          role: entry.role,
          subrole: entry.subrole,
          releasedAt: entry.releasedAt,
        });
        results.push({ codename, ok: true, abilities: result.abilitiesCount });
      } catch (error) {
        results.push({ codename, ok: false, error: (error as Error).message });
      }
    }

    console.log('동기화 결과:');
    console.table(results);
  }
}
