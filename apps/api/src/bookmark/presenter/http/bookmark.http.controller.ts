import { User } from '@@decorators';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CreateBookmarkUseCase } from '../../application/use-cases/create-bookmark.use-case';
import { DeleteBookmarkUseCase } from '../../application/use-cases/delete-bookmark.use-case';
import { ImportBookmarksUseCase } from '../../application/use-cases/import-bookmarks.use-case';
import { ListBookmarksUseCase } from '../../application/use-cases/list-bookmarks.use-case';
import { BookmarkEntity } from '../../entities/bookmark.entity';
import { BookmarkRouter } from './bookmark.path.presenter';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { DeleteBookmarkParamsDto } from './dto/delete-bookmark.dto';
import { ImportBookmarksDto, ImportBookmarksResponseDto } from './dto/import-bookmarks.dto';
import { ListBookmarksRequestDto, ListBookmarksResponseDto } from './dto/list-bookmarks.dto';

@ApiTags(BookmarkRouter.HttpApiTags)
@ApiBearerAuth('accessToken')
@UseGuards(JwtAuthGuard)
@Controller(BookmarkRouter.Root)
export class BookmarkHttpController {
  constructor(
    private readonly listBookmarksUseCase: ListBookmarksUseCase,
    private readonly createBookmarkUseCase: CreateBookmarkUseCase,
    private readonly deleteBookmarkUseCase: DeleteBookmarkUseCase,
    private readonly importBookmarksUseCase: ImportBookmarksUseCase,
  ) {}

  @ApiOperation({ summary: '내 북마크 조회 (kind 선택 필터)' })
  @Get(BookmarkRouter.Http.List)
  async list(
    @User() user: { id: number },
    @Query() queryDto: ListBookmarksRequestDto,
  ): Promise<ListBookmarksResponseDto> {
    const items = await this.listBookmarksUseCase.execute({ userId: user.id, kind: queryDto.kind });
    return { items };
  }

  @ApiOperation({ summary: '북마크 추가 (idempotent — 같은 (kind, targetId) 재호출 시 metadata 갱신)' })
  @HttpCode(HttpStatus.CREATED)
  @Post(BookmarkRouter.Http.Create)
  async create(@User() user: { id: number }, @Body() bodyDto: CreateBookmarkDto): Promise<BookmarkEntity> {
    return await this.createBookmarkUseCase.execute({ userId: user.id, ...bodyDto });
  }

  @ApiOperation({ summary: '북마크 삭제 (멱등)' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(BookmarkRouter.Http.Delete)
  async delete(@User() user: { id: number }, @Param() params: DeleteBookmarkParamsDto): Promise<void> {
    await this.deleteBookmarkUseCase.execute({ userId: user.id, ...params });
  }

  @ApiOperation({ summary: '게스트 localStorage 북마크를 회원 계정으로 1회 흡수' })
  @HttpCode(HttpStatus.OK)
  @Post(BookmarkRouter.Http.Import)
  async import(@User() user: { id: number }, @Body() bodyDto: ImportBookmarksDto): Promise<ImportBookmarksResponseDto> {
    return await this.importBookmarksUseCase.execute({ userId: user.id, items: bodyDto.items });
  }
}
