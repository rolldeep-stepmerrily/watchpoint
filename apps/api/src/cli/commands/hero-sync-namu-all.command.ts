import { Command, CommandRunner } from 'nest-commander';

import { NamuwikiHeroScraper } from '../../scraper/namuwiki';
import { HERO_REGISTRY } from '../hero-registry';

@Command({
  name: 'hero:sync:namu:all',
  description: 'hero-registry에 등록된 모든 영웅의 한국어 ability 명칭을 나무위키에서 순차 보강합니다.',
})
export class HeroSyncNamuAllCommand extends CommandRunner {
  constructor(private readonly scraper: NamuwikiHeroScraper) {
    super();
  }

  async run(): Promise<void> {
    const codenames = Object.keys(HERO_REGISTRY);
    console.log(`${codenames.length}명 나무위키 명칭 보강 시작...`);

    const results: Array<{
      codename: string;
      matched: boolean;
      abilitiesParsed: number;
      abilitiesUpdated: number;
      unmatchedCount: number;
      error?: string;
    }> = [];

    for (const codename of codenames) {
      try {
        const result = await this.scraper.sync(codename);
        results.push({
          codename,
          matched: result.matched,
          abilitiesParsed: result.abilitiesParsed,
          abilitiesUpdated: result.abilitiesUpdated,
          unmatchedCount: result.unmatchedAbilities.length,
        });
      } catch (error) {
        results.push({
          codename,
          matched: false,
          abilitiesParsed: 0,
          abilitiesUpdated: 0,
          unmatchedCount: 0,
          error: (error as Error).message,
        });
      }
    }

    console.log('보강 결과:');
    console.table(results);
    const heroOk = results.filter((r) => r.matched).length;
    const abilityUpdated = results.reduce((sum, r) => sum + r.abilitiesUpdated, 0);
    const totalUnmatched = results.reduce((sum, r) => sum + r.unmatchedCount, 0);
    console.log(`영웅 ${heroOk}/${results.length} · 능력 갱신 ${abilityUpdated} · 매칭 실패 ${totalUnmatched}`);
  }
}
