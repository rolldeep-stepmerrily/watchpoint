import { Command, CommandRunner } from 'nest-commander';

import { BlizzardHeroKoScraper } from '../../scraper/blizzard';
import { HERO_REGISTRY } from '../hero-registry';

@Command({
  name: 'hero:sync',
  arguments: '<codename>',
  description: '단일 영웅을 Blizzard 한국어 페이지에서 동기화합니다.',
})
export class HeroSyncCommand extends CommandRunner {
  constructor(private readonly scraper: BlizzardHeroKoScraper) {
    super();
  }

  async run(inputs: string[]): Promise<void> {
    const [codename] = inputs;
    if (!codename) {
      console.error('codename 필요: pnpm hero:sync <codename>');
      process.exit(1);
    }

    if (!HERO_REGISTRY[codename]) {
      console.error(
        `'${codename}' 영웅이 hero-registry에 등록되지 않았습니다. packages/shared/src/constants/hero-catalog.ts에 추가하세요.`,
      );
      process.exit(1);
    }

    console.log(`${codename} 동기화 시작 (Blizzard ko-kr)...`);
    const result = await this.scraper.sync(codename);
    console.log('동기화 완료:');
    console.table(result);
  }
}
