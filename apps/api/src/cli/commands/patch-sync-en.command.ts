import { Command, CommandRunner } from 'nest-commander';

import { BlizzardPatchEnScraper } from '../../scraper/blizzard';

@Command({
  name: 'patch:sync:en',
  description: '최신 패치노트들의 영문 title/summary + 영웅 entry title/body를 Blizzard 영문 페이지에서 보강합니다.',
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
    console.log(
      `patch ${summary.matched}/${summary.fetched} (skipped ${summary.skipped}) · entry ${summary.entriesMatched}/${summary.entriesTotal}`,
    );
    if (summary.entriesTotal > 0 && summary.entriesMatched === 0) {
      console.log('hint: entry 매칭 0건 — hero:sync:en:all 먼저 돌려 nameTranslations.en이 채워졌는지 확인');
    }
  }
}
