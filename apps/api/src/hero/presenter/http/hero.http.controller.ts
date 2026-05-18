import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetHeroUseCase } from '../../application/use-cases/get-hero.use-case';
import { GetHeroAbilitiesUseCase } from '../../application/use-cases/get-hero-abilities.use-case';
import { GetHeroListUseCase } from '../../application/use-cases/get-hero-list.use-case';
import { GetHeroPatchHistoryUseCase } from '../../application/use-cases/get-hero-patch-history.use-case';
import { GetHeroResponseDto } from './dto/get-hero.dto';
import { GetHeroAbilitiesResponseDto } from './dto/get-hero-abilities.dto';
import { GetHeroListRequestDto, GetHeroListResponseDto } from './dto/get-hero-list.dto';
import { GetHeroPatchHistoryResponseDto } from './dto/get-hero-patch-history.dto';
import { HeroRouter } from './hero.path.presenter';

@ApiTags(HeroRouter.HttpApiTags)
@Controller(HeroRouter.Root)
export class HeroHttpController {
  constructor(
    private readonly getHeroListUseCase: GetHeroListUseCase,
    private readonly getHeroUseCase: GetHeroUseCase,
    private readonly getHeroAbilitiesUseCase: GetHeroAbilitiesUseCase,
    private readonly getHeroPatchHistoryUseCase: GetHeroPatchHistoryUseCase,
  ) {}

  @ApiOperation({ summary: '영웅 목록 조회' })
  @Get(HeroRouter.Http.GetList)
  async getList(@Query() queryDto: GetHeroListRequestDto): Promise<GetHeroListResponseDto> {
    return await this.getHeroListUseCase.execute(queryDto);
  }

  @ApiOperation({ summary: '영웅 상세 조회 (stat + abilities 포함)' })
  @Get(HeroRouter.Http.GetOne)
  async getOne(@Param('codename') codename: string): Promise<GetHeroResponseDto> {
    return await this.getHeroUseCase.execute({ codename });
  }

  @ApiOperation({ summary: '영웅 능력 목록 조회' })
  @Get(HeroRouter.Http.GetAbilities)
  async getAbilities(@Param('codename') codename: string): Promise<GetHeroAbilitiesResponseDto> {
    return await this.getHeroAbilitiesUseCase.execute({ codename });
  }

  @ApiOperation({ summary: '영웅 관련 패치 이력 조회 (PUBLISHED 패치만)' })
  @Get(HeroRouter.Http.GetPatchHistory)
  async getPatchHistory(@Param('codename') codename: string): Promise<GetHeroPatchHistoryResponseDto> {
    return await this.getHeroPatchHistoryUseCase.execute({ codename });
  }
}
