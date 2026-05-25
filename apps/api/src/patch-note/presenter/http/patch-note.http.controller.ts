import { LangQuery } from '@@decorators';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { LOCALES, type Locale } from '@watchpoint/shared';
import { GetLatestPatchNoteUseCase } from '../../application/use-cases/get-latest-patch-note.use-case';
import { GetPatchNoteUseCase } from '../../application/use-cases/get-patch-note.use-case';
import { GetPatchNoteEntriesUseCase } from '../../application/use-cases/get-patch-note-entries.use-case';
import { GetPatchNoteListUseCase } from '../../application/use-cases/get-patch-note-list.use-case';
import { GetLatestPatchNoteResponseDto } from './dto/get-latest-patch-note.dto';
import { GetPatchNoteResponseDto } from './dto/get-patch-note.dto';
import { GetPatchNoteEntriesRequestDto, GetPatchNoteEntriesResponseDto } from './dto/get-patch-note-entries.dto';
import { GetPatchNoteListRequestDto, GetPatchNoteListResponseDto } from './dto/get-patch-note-list.dto';
import { PatchNoteRouter } from './patch-note.path.presenter';

@ApiTags(PatchNoteRouter.HttpApiTags)
@Controller(PatchNoteRouter.Root)
export class PatchNoteHttpController {
  constructor(
    private readonly getPatchNoteListUseCase: GetPatchNoteListUseCase,
    private readonly getLatestPatchNoteUseCase: GetLatestPatchNoteUseCase,
    private readonly getPatchNoteUseCase: GetPatchNoteUseCase,
    private readonly getPatchNoteEntriesUseCase: GetPatchNoteEntriesUseCase,
  ) {}

  @ApiOperation({ summary: '패치노트 목록 조회 (최신순, PUBLISHED만)' })
  @ApiQuery({ name: 'lang', enum: LOCALES, required: false, description: '응답 언어 (기본 ko)' })
  @Get(PatchNoteRouter.Http.GetList)
  async getList(
    @Query() queryDto: GetPatchNoteListRequestDto,
    @LangQuery() lang: Locale,
  ): Promise<GetPatchNoteListResponseDto> {
    return await this.getPatchNoteListUseCase.execute({ ...queryDto, lang });
  }

  @ApiOperation({ summary: '가장 최근 패치노트 1건 조회' })
  @ApiQuery({ name: 'lang', enum: LOCALES, required: false, description: '응답 언어 (기본 ko)' })
  @Get(PatchNoteRouter.Http.GetLatest)
  async getLatest(@LangQuery() lang: Locale): Promise<GetLatestPatchNoteResponseDto> {
    return await this.getLatestPatchNoteUseCase.execute({ lang });
  }

  @ApiOperation({ summary: '패치노트 상세 조회 (entries 포함)' })
  @ApiQuery({ name: 'lang', enum: LOCALES, required: false, description: '응답 언어 (기본 ko)' })
  @Get(PatchNoteRouter.Http.GetOne)
  async getOne(@Param('version') version: string, @LangQuery() lang: Locale): Promise<GetPatchNoteResponseDto> {
    return await this.getPatchNoteUseCase.execute({ version, lang });
  }

  @ApiOperation({ summary: '패치노트 entry 목록 조회 (category 필터)' })
  @Get(PatchNoteRouter.Http.GetEntries)
  async getEntries(
    @Param('version') version: string,
    @Query() queryDto: GetPatchNoteEntriesRequestDto,
  ): Promise<GetPatchNoteEntriesResponseDto> {
    return await this.getPatchNoteEntriesUseCase.execute({ version, category: queryDto.category });
  }
}
