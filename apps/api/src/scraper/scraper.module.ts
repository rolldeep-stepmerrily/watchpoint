import { forwardRef, Module } from '@nestjs/common';

import { SeederModule } from '../seeder';
import {
  BlizzardHeroEnScraper,
  BlizzardHeroKoScraper,
  BlizzardHeroParser,
  BlizzardIconParser,
  BlizzardPatchCron,
  BlizzardPatchEnScraper,
  BlizzardPatchParser,
  BlizzardPatchScraper,
} from './blizzard';
import { ScrapeJobRecorder, ScraperHttpClient } from './common';
import { NamuwikiHeroParser, NamuwikiHeroScraper } from './namuwiki';

@Module({
  imports: [forwardRef(() => SeederModule)],
  providers: [
    /** common */
    ScraperHttpClient,
    ScrapeJobRecorder,

    /** blizzard */
    BlizzardPatchParser,
    BlizzardPatchScraper,
    BlizzardPatchEnScraper,
    BlizzardPatchCron,
    BlizzardHeroParser,
    BlizzardHeroEnScraper,
    BlizzardHeroKoScraper,
    BlizzardIconParser,

    /** namuwiki */
    NamuwikiHeroParser,
    NamuwikiHeroScraper,
  ],
  exports: [
    BlizzardPatchScraper,
    BlizzardPatchEnScraper,
    NamuwikiHeroScraper,
    BlizzardHeroEnScraper,
    BlizzardHeroKoScraper,
    BlizzardIconParser,
    ScraperHttpClient,
  ],
})
export class ScraperModule {}
