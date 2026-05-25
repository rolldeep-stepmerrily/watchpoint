import { Module } from '@nestjs/common';

import { SearchQueryHandler } from './application/queries/search.query';
import { SearchUseCase } from './application/use-cases/search.use-case';
import { SearchHttpController } from './presenter/http/search.http.controller';

@Module({
  controllers: [SearchHttpController],
  providers: [
    /** query-handlers */
    SearchQueryHandler,

    /** use-cases */
    SearchUseCase,
  ],
})
export class SearchModule {}
