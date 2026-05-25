import { Command, CommandRunner } from 'nest-commander';

import { BlizzardPatchEnScraper } from '../../scraper/blizzard';

@Command({
  name: 'patch:sync:en',
  description: '최신 패치노트들의 영문 title/summary를 Blizzard 영문 페이지에서 보강합니다.',
})
export class PatchSyncEnCommand extends CommandRunner {
  constructor(private readonly scraper: BlizzardPatchEnScraper) {
    super();
  }

  async run(): Promise<void> {
    console.log('영문 patch notes 보강 시작...');
    const summary = await this.scraper.sync();
    console.log('보강 결과:');
    console.table([summary]);
  }
}
