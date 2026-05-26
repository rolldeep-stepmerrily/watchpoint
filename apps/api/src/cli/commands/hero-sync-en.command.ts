import { Command, CommandRunner } from 'nest-commander';

import { BlizzardHeroEnScraper } from '../../scraper/blizzard';
import { HERO_REGISTRY } from '../hero-registry';

@Command({
  name: 'hero:sync:en',
  arguments: '<codename>',
  description: '단일 영웅의 영문 이름/설명을 Blizzard 영문 페이지에서 보강합니다.',
})
export class HeroSyncEnCommand extends CommandRunner {
  constructor(private readonly scraper: BlizzardHeroEnScraper) {
    super();
  }

  async run(inputs: string[]): Promise<void> {
    const [codename] = inputs;
    if (!codename) {
      console.error('codename 필요: pnpm hero:sync:en <codename>');
      process.exit(1);
    }

    if (!HERO_REGISTRY[codename]) {
      console.error(`'${codename}' 영웅이 hero-registry에 등록되지 않았습니다.`);
      process.exit(1);
    }

    console.log(`${codename} 영문 보강 시작...`);
    const result = await this.scraper.sync(codename);
    console.log('보강 결과:');
    console.table(result);
  }
}
