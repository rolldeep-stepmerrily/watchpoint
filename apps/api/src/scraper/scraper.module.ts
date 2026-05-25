import { Module } from '@nestjs/common';

import {
  BlizzardHeroEnScraper,
  BlizzardHeroParser,
  BlizzardPatchCron,
  BlizzardPatchEnScraper,
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
    BlizzardPatchEnScraper,
    BlizzardPatchCron,
    BlizzardHeroParser,
    BlizzardHeroEnScraper,

    /** namuwiki */
    NamuwikiHeroParser,
    NamuwikiHeroScraper,
  ],
  exports: [BlizzardPatchScraper, BlizzardPatchEnScraper, NamuwikiHeroScraper, BlizzardHeroEnScraper],
})
export class ScraperModule {}
