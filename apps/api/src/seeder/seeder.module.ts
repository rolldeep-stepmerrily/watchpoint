import { forwardRef, Module } from '@nestjs/common';

import { PrismaModule } from '../common/prisma';
import { ScraperModule } from '../scraper/scraper.module';
import { BootSeederService } from './boot-seeder.service';
import { HeroDiffLogger } from './hero-diff-logger.service';
import { HeroIconMatcher } from './hero-icon-matcher.service';

@Module({
  imports: [PrismaModule, forwardRef(() => ScraperModule)],
  providers: [HeroDiffLogger, HeroIconMatcher, BootSeederService],
  exports: [HeroDiffLogger, HeroIconMatcher],
})
export class SeederModule {}
