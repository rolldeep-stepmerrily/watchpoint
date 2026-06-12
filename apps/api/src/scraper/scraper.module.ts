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
import { MinioUploader } from './minio';
import { NamuwikiHeroParser, NamuwikiHeroScraper } from './namuwiki';
import { WebRevalidatorService } from './web';

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

    /** namuwiki (한국어 명칭/아이콘 보강용 — 후속 PR에서 ko sync/icon matcher에 통합) */
    NamuwikiHeroParser,
    NamuwikiHeroScraper,

    /** minio */
    MinioUploader,

    /** web ISR revalidate */
    WebRevalidatorService,
  ],
  exports: [
    BlizzardPatchScraper,
    BlizzardPatchEnScraper,
    BlizzardHeroEnScraper,
    BlizzardHeroKoScraper,
    BlizzardIconParser,
    NamuwikiHeroScraper,
    ScraperHttpClient,
    MinioUploader,
  ],
})
export class ScraperModule {}
