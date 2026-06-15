import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { GetCareerSummaryUseCase } from '../../application/use-cases/get-career-summary.use-case';
import { SearchCareerUseCase } from '../../application/use-cases/search-career.use-case';
import { CareerRouter } from './career.path.presenter';
import { GetCareerSummaryResponseDto } from './dto/get-career-summary.dto';
import { SearchCareerRequestDto, SearchCareerResponseDto } from './dto/search-career.dto';

@ApiTags(CareerRouter.HttpApiTags)
@Controller(CareerRouter.Root)
export class CareerHttpController {
  constructor(
    private readonly searchCareerUseCase: SearchCareerUseCase,
    private readonly getCareerSummaryUseCase: GetCareerSummaryUseCase,
  ) {}

  @ApiOperation({
    summary: '[Beta] 전적 검색',
    description:
      '플레이어 이름 또는 BattleTag로 OverFast API(비공식 Overwatch API)에 검색을 위임한다. ' +
      '응답은 5분 캐시되며 upstream 장애 시 502/429를 반환할 수 있다.',
  })
  @Get(CareerRouter.Http.Search)
  async search(@Query() queryDto: SearchCareerRequestDto): Promise<SearchCareerResponseDto> {
    return await this.searchCareerUseCase.execute(queryDto);
  }

  @ApiOperation({
    summary: '[Beta] 전적 상세 — 프로필 + 경쟁전 랭크',
    description:
      'playerId는 BattleTag의 `#`를 `-`로 치환한 형태(예: TeKrop-2217). ' +
      '응답은 10분 캐시. 플레이어가 프로필을 비공개 설정한 경우 404를 반환한다.',
  })
  @Get(CareerRouter.Http.GetSummary)
  async getSummary(@Param('playerId') playerId: string): Promise<GetCareerSummaryResponseDto> {
    return await this.getCareerSummaryUseCase.execute({ playerId });
  }
}
