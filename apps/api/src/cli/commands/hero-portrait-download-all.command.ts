import { Command, CommandRunner } from 'nest-commander';

import { HeroIconMatcher } from '../../seeder';
import { HERO_REGISTRY } from '../hero-registry';

@Command({
  name: 'hero:portrait:download:all',
  description: 'hero-registry에 등록된 모든 영웅의 portrait 이미지를 Blizzard 한국어 페이지에서 순차 다운로드.',
})
export class HeroPortraitDownloadAllCommand extends CommandRunner {
  constructor(private readonly matcher: HeroIconMatcher) {
    super();
  }

  async run(): Promise<void> {
    const codenames = Object.keys(HERO_REGISTRY);
    console.log(`${codenames.length}명 portrait 다운로드 시작...`);

    const results: Array<{ codename: string; saved: boolean; skipped?: string; error?: string }> = [];

    for (const codename of codenames) {
      try {
        const result = await this.matcher.downloadPortraitFor(codename);
        results.push({ codename: result.codename, saved: result.saved, skipped: result.skipped });
      } catch (error) {
        results.push({ codename, saved: false, error: (error as Error).message });
      }
    }

    console.table(results);
    const ok = results.filter((r) => r.saved).length;
    console.log(`portrait 저장 ${ok}/${results.length}`);
  }
}
