import { Command, CommandRunner } from 'nest-commander';

import { HeroIconMatcher } from '../../seeder';
import { HERO_REGISTRY } from '../hero-registry';

@Command({
  name: 'hero:portrait:download',
  arguments: '<codename>',
  description: 'Blizzard 한국어 영웅 페이지에서 portrait 이미지를 다운로드하고 DB portraitUrl을 로컬 path로 갱신.',
})
export class HeroPortraitDownloadCommand extends CommandRunner {
  constructor(private readonly matcher: HeroIconMatcher) {
    super();
  }

  async run(inputs: string[]): Promise<void> {
    const [codename] = inputs;
    if (!codename) {
      console.error('codename 필요: pnpm hero:portrait:download <codename>');
      process.exit(1);
    }
    if (!HERO_REGISTRY[codename]) {
      console.error(`'${codename}' 영웅이 hero-registry에 등록되지 않았습니다.`);
      process.exit(1);
    }

    const result = await this.matcher.downloadPortraitFor(codename);
    console.table([result]);
  }
}
