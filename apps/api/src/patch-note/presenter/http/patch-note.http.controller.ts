import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
  @Get(PatchNoteRouter.Http.GetList)
  async getList(@Query() queryDto: GetPatchNoteListRequestDto): Promise<GetPatchNoteListResponseDto> {
    return await this.getPatchNoteListUseCase.execute(queryDto);
  }

  @ApiOperation({ summary: '가장 최근 패치노트 1건 조회' })
  @Get(PatchNoteRouter.Http.GetLatest)
  async getLatest(): Promise<GetLatestPatchNoteResponseDto> {
    return await this.getLatestPatchNoteUseCase.execute();
  }

  @ApiOperation({ summary: '패치노트 상세 조회 (entries 포함)' })
  @Get(PatchNoteRouter.Http.GetOne)
  async getOne(@Param('version') version: string): Promise<GetPatchNoteResponseDto> {
    return await this.getPatchNoteUseCase.execute({ version });
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
