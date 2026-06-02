import { ResponseCache } from '@@cache';
import { Command, CommandRunner } from 'nest-commander';

import { HeroIconMatcher } from '../hero-icon-matcher';
import { HERO_REGISTRY } from '../hero-registry';

@Command({
  name: 'hero:icons:download',
  arguments: '<codename>',
  description: '나무위키 영웅 페이지에서 능력/특전 아이콘을 다운로드해 apps/web/public/icons에 저장 + DB iconUrl 갱신.',
})
export class HeroIconsDownloadCommand extends CommandRunner {
  constructor(
    private readonly matcher: HeroIconMatcher,
    private readonly cache: ResponseCache,
  ) {
    super();
  }

  async run(inputs: string[]): Promise<void> {
    const [codename] = inputs;

    if (!codename) {
      console.error('codename 필요: pnpm hero:icons:download <codename>');
      process.exit(1);
    }

    const entry = HERO_REGISTRY[codename];

    if (!entry) {
      console.error(`'${codename}' 영웅이 hero-registry에 등록되지 않았습니다.`);
      process.exit(1);
    }

    const result = await this.matcher.downloadFor(codename, entry.pageTitle);

    console.log('완료:');
    console.table([
      {
        codename: result.codename,
        abilities: `${result.abilityMatched}/${result.abilityTotal}`,
        perks: `${result.perkMatched}/${result.perkTotal}`,
        unmatchedDb: result.unmatchedAbilities.length + result.unmatchedPerks.length,
        extraImages: result.extraImages.length,
      },
    ]);

    if (result.unmatchedAbilities.length > 0) {
      console.log('\nDB에 있지만 아이콘을 못 찾은 능력:');

      for (const name of result.unmatchedAbilities) {
        console.log(`  - ${name}`);
      }
    }

    if (result.unmatchedPerks.length > 0) {
      console.log('\nDB에 있지만 아이콘을 못 찾은 특전:');

      for (const name of result.unmatchedPerks) {
        console.log(`  - ${name}`);
      }
    }

    if (result.extraImages.length > 0) {
      console.log('\nHTML에 있지만 DB와 매칭 안 된 이미지 (참고용):');

      for (const name of result.extraImages) {
        console.log(`  - ${name}`);
      }
    }

    await this.cache.invalidateAll();
  }
}
