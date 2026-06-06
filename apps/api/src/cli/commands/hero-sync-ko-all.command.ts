import { Command, CommandRunner } from 'nest-commander';

import { BlizzardHeroKoScraper } from '../../scraper/blizzard';
import { HERO_REGISTRY } from '../hero-registry';

@Command({
  name: 'hero:sync:ko:all',
  description: 'hero-registry에 등록된 모든 영웅의 한국어 이름/설명/능력을 Blizzard 한국어 페이지에서 순차 동기화합니다.',
})
export class HeroSyncKoAllCommand extends CommandRunner {
  constructor(private readonly scraper: BlizzardHeroKoScraper) {
    super();
  }

  async run(): Promise<void> {
    const codenames = Object.keys(HERO_REGISTRY);
    console.log(`${codenames.length}명 한국어 동기화 시작 (요청 간 ScraperHttpClient의 delay 적용)...`);

    const results: Array<{
      codename: string;
      matched: boolean;
      abilitiesUpserted: number;
      abilitiesParsed: number;
      abilitiesPreserved: number;
      error?: string;
    }> = [];

    for (const codename of codenames) {
      try {
        const result = await this.scraper.sync(codename);
        results.push({
          codename,
          matched: result.matched,
          abilitiesUpserted: result.abilitiesUpserted,
          abilitiesParsed: result.abilitiesParsed,
          abilitiesPreserved: result.abilitiesPreserved,
        });
      } catch (error) {
        results.push({
          codename,
          matched: false,
          abilitiesUpserted: 0,
          abilitiesParsed: 0,
          abilitiesPreserved: 0,
          error: (error as Error).message,
        });
      }
    }

    console.log('동기화 결과:');
    console.table(results);
    const heroOk = results.filter((r) => r.matched).length;
    const upserted = results.reduce((sum, r) => sum + r.abilitiesUpserted, 0);
    const preserved = results.reduce((sum, r) => sum + r.abilitiesPreserved, 0);
    console.log(`영웅 ${heroOk}/${results.length} · 능력 upserted ${upserted}, preserved ${preserved}`);
  }
}
