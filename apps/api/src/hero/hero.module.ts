import { Module } from '@nestjs/common';
import { GetHeroByCodenameQueryHandler } from './application/queries/get-hero-by-codename.query';
import { GetHeroListQueryHandler } from './application/queries/get-hero-list.query';
import { GetHeroPatchHistoryQueryHandler } from './application/queries/get-hero-patch-history.query';
import { GetHeroAbilitiesUseCase } from './application/use-cases/get-hero-abilities.use-case';
import { GetHeroListUseCase } from './application/use-cases/get-hero-list.use-case';
import { GetHeroPatchHistoryUseCase } from './application/use-cases/get-hero-patch-history.use-case';
import { GetHeroUseCase } from './application/use-cases/get-hero.use-case';
import { HeroHttpController } from './presenter/http/hero.http.controller';

@Module({
  controllers: [HeroHttpController],
  providers: [
    /** query-handlers */
    GetHeroByCodenameQueryHandler,
    GetHeroListQueryHandler,
    GetHeroPatchHistoryQueryHandler,

    /** use-cases */
    GetHeroAbilitiesUseCase,
    GetHeroListUseCase,
    GetHeroPatchHistoryUseCase,
    GetHeroUseCase,
  ],
})
export class HeroModule {}
