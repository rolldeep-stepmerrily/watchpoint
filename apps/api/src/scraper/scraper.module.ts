import { Module } from '@nestjs/common';

import { BlizzardPatchCron, BlizzardPatchParser, BlizzardPatchScraper } from './blizzard';
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

    /** namuwiki */
    NamuwikiHeroParser,
    NamuwikiHeroScraper,
  ],
  exports: [BlizzardPatchScraper, NamuwikiHeroScraper],
})
export class ScraperModule {}
