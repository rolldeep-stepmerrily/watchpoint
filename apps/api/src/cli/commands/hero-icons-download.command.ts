import { ResponseCache } from '@@cache';
import { Command, CommandRunner } from 'nest-commander';

import { HeroIconMatcher } from '../../seeder';
import { HERO_REGISTRY } from '../hero-registry';

@Command({
  name: 'hero:icons:download',
  arguments: '<codename>',
  description:
    'Blizzard 영문 영웅 페이지에서 능력/특전 아이콘을 다운로드해 apps/web/public/icons에 저장 + DB iconUrl 갱신.',
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

    if (!HERO_REGISTRY[codename]) {
      console.error(`'${codename}' 영웅이 hero-registry에 등록되지 않았습니다.`);
      process.exit(1);
    }

    const result = await this.matcher.downloadFor(codename);

    console.log('완료:');
    console.table([
      {
        codename: result.codename,
        abilities: `${result.abilityMatched}/${result.abilityTotal}`,
        perks: `${result.perkMatched}/${result.perkTotal}`,
        unmatchedDb: result.unmatchedAbilities.length + result.unmatchedPerks.length,
        extraIds: result.extraAbilityIds.length,
        skipped: result.skipped ?? '',
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

    if (result.extraAbilityIds.length > 0) {
      console.log('\nBlizzard 페이지에 있지만 DB와 매칭 안 된 ability id (참고용):');

      for (const id of result.extraAbilityIds) {
        console.log(`  - ${id}`);
      }
    }

    await this.cache.invalidateAll();
  }
}
