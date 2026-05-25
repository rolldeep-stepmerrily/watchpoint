import { Module } from '@nestjs/common';

import {
  BlizzardHeroEnScraper,
  BlizzardHeroParser,
  BlizzardPatchCron,
  BlizzardPatchParser,
  BlizzardPatchScraper,
} from './blizzard';
import { ScrapeJobRecorder, ScraperHttpClient } from './common';
import { NamuwikiHeroParser, NamuwikiHeroScraper } from './namuwiki';

@Module({
  providers: [
    /** common */
    ScraperHttpClient,
    ScrapeJobRecorder,

    /** blizzard */
    BlizzardPatchParser,
    BlizzardPatchScraper,
    BlizzardPatchCron,
    BlizzardHeroParser,
    BlizzardHeroEnScraper,

    /** namuwiki */
    NamuwikiHeroParser,
    NamuwikiHeroScraper,
  ],
  exports: [BlizzardPatchScraper, NamuwikiHeroScraper, BlizzardHeroEnScraper],
})
export class ScraperModule {}
