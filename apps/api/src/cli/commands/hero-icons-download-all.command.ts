import { ResponseCache } from '@@cache';
import { Command, CommandRunner } from 'nest-commander';

import { HeroIconMatcher } from '../../seeder';
import { HERO_REGISTRY } from '../hero-registry';

interface CodenameSummary {
  codename: string;
  ok: boolean;
  abilities: string;
  perks: string;
  unmatchedDb: number;
  extra: number;
  note?: string;
}

@Command({
  name: 'hero:icons:download:all',
  description: 'hero-registry 전체 영웅에 대해 Blizzard 영문 페이지에서 능력/특전 아이콘을 일괄 다운로드.',
})
export class HeroIconsDownloadAllCommand extends CommandRunner {
  constructor(
    private readonly matcher: HeroIconMatcher,
    private readonly cache: ResponseCache,
  ) {
    super();
  }

  async run(): Promise<void> {
    const entries = Object.entries(HERO_REGISTRY);
    console.log(`${entries.length}명 아이콘 일괄 다운로드 시작...`);
    const summaries: CodenameSummary[] = [];
    const unmatchedDetail: Array<{ codename: string; names: string[] }> = [];

    for (const [codename] of entries) {
      try {
        const result = await this.matcher.downloadFor(codename);
        const unmatched = [...result.unmatchedAbilities, ...result.unmatchedPerks];
        summaries.push({
          codename,
          ok: result.matched,
          abilities: `${result.abilityMatched}/${result.abilityTotal}`,
          perks: `${result.perkMatched}/${result.perkTotal}`,
          unmatchedDb: unmatched.length,
          extra: result.extraAbilityIds.length,
          note: result.skipped ?? '',
        });

        if (unmatched.length > 0 && result.matched) {
          unmatchedDetail.push({ codename, names: unmatched });
        }
      } catch (error) {
        summaries.push({
          codename,
          ok: false,
          abilities: '-',
          perks: '-',
          unmatchedDb: 0,
          extra: 0,
          note: (error as Error).message,
        });
      }
    }

    console.log('\n결과:');
    console.table(summaries);

    if (unmatchedDetail.length > 0) {
      console.log('\nDB에 있지만 아이콘을 못 찾은 항목 (override 후보):');

      for (const { codename, names } of unmatchedDetail) {
        console.log(`  [${codename}] ${names.join(', ')}`);
      }
    }

    await this.cache.invalidateAll();
  }
}
