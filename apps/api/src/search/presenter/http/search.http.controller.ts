import { LangQuery } from '@@decorators';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { LOCALES, type Locale } from '@watchpoint/shared';

import { SearchUseCase } from '../../application/use-cases/search.use-case';
import { GetSearchResponseDto, SearchRequestDto } from './dto/search.dto';
import { SearchRouter } from './search.path.presenter';

@ApiTags(SearchRouter.HttpApiTags)
@Controller(SearchRouter.Root)
export class SearchHttpController {
  constructor(private readonly searchUseCase: SearchUseCase) {}

  @ApiOperation({ summary: '영웅·패치노트 통합 검색 (PUBLISHED 패치만)' })
  @ApiQuery({ name: 'lang', enum: LOCALES, required: false, description: '응답 언어 (기본 ko)' })
  @Get(SearchRouter.Http.Get)
  async search(@Query() queryDto: SearchRequestDto, @LangQuery() lang: Locale): Promise<GetSearchResponseDto> {
    return await this.searchUseCase.execute({ q: queryDto.q, lang });
  }
}
