import { Module } from '@nestjs/common';

import { PrismaModule } from '../common/prisma';
import { ScraperModule } from '../scraper/scraper.module';
import { BootSeederService } from './boot-seeder.service';
import { HeroIconMatcher } from './hero-icon-matcher.service';

@Module({
  imports: [PrismaModule, ScraperModule],
  providers: [HeroIconMatcher, BootSeederService],
  exports: [HeroIconMatcher],
})
export class SeederModule {}
