import { Command, CommandRunner } from 'nest-commander';

import { BlizzardHeroKoScraper } from '../../scraper/blizzard';
import { HERO_REGISTRY } from '../hero-registry';

@Command({
  name: 'hero:sync:ko',
  arguments: '<codename>',
  description: '단일 영웅의 한국어 이름/설명/능력을 Blizzard 한국어 페이지에서 동기화합니다.',
})
export class HeroSyncKoCommand extends CommandRunner {
  constructor(private readonly scraper: BlizzardHeroKoScraper) {
    super();
  }

  async run(inputs: string[]): Promise<void> {
    const [codename] = inputs;
    if (!codename) {
      console.error('codename 필요: pnpm hero:sync:ko <codename>');
      process.exit(1);
    }

    if (!HERO_REGISTRY[codename]) {
      console.error(`'${codename}' 영웅이 hero-registry에 등록되지 않았습니다.`);
      process.exit(1);
    }

    console.log(`${codename} 한국어 동기화 시작...`);
    const result = await this.scraper.sync(codename);
    console.log('동기화 결과:');
    console.table(result);
  }
}
