import { Command, CommandRunner } from 'nest-commander';

import { NamuwikiHeroScraper } from '../../scraper/namuwiki';
import { HERO_REGISTRY } from '../hero-registry';

@Command({
  name: 'hero:sync:namu',
  arguments: '<codename>',
  description: '단일 영웅의 한국어 ability 명칭을 나무위키 페이지에서 우선 적용합니다.',
})
export class HeroSyncNamuCommand extends CommandRunner {
  constructor(private readonly scraper: NamuwikiHeroScraper) {
    super();
  }

  async run(inputs: string[]): Promise<void> {
    const [codename] = inputs;
    if (!codename) {
      console.error('codename 필요: pnpm hero:sync:namu <codename>');
      process.exit(1);
    }

    if (!HERO_REGISTRY[codename]) {
      console.error(`'${codename}' 영웅이 hero-registry에 등록되지 않았습니다.`);
      process.exit(1);
    }

    console.log(`${codename} 나무위키 명칭 보강 시작...`);
    const result = await this.scraper.sync(codename);
    console.log('보강 결과:');
    console.table({
      codename: result.codename,
      matched: result.matched,
      abilitiesParsed: result.abilitiesParsed,
      abilitiesUpdated: result.abilitiesUpdated,
      unmatched: result.unmatchedAbilities.join(', ') || '(none)',
    });
  }
}
