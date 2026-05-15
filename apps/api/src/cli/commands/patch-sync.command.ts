import { Command, CommandRunner } from 'nest-commander';

import { BlizzardPatchScraper } from '../../scraper/blizzard';

@Command({
  name: 'patch:sync',
  description: '블리자드 공식 패치노트 페이지를 스크랩해 DB에 반영합니다.',
})
export class PatchSyncCommand extends CommandRunner {
  constructor(private readonly scraper: BlizzardPatchScraper) {
    super();
  }

  async run(): Promise<void> {
    console.log('블리자드 패치노트 동기화 시작...');
    const summary = await this.scraper.sync();
    console.log('동기화 완료:');
    console.table(summary);
  }
}
