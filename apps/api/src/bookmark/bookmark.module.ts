import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { BulkCreateBookmarksCommandHandler } from './application/commands/bulk-create-bookmarks.command';
import { RemoveBookmarkCommandHandler } from './application/commands/remove-bookmark.command';
import { SaveBookmarkCommandHandler } from './application/commands/save-bookmark.command';
import { CountUserBookmarksQueryHandler } from './application/queries/count-user-bookmarks.query';
import { ListUserBookmarksQueryHandler } from './application/queries/list-user-bookmarks.query';
import { CreateBookmarkUseCase } from './application/use-cases/create-bookmark.use-case';
import { DeleteBookmarkUseCase } from './application/use-cases/delete-bookmark.use-case';
import { ImportBookmarksUseCase } from './application/use-cases/import-bookmarks.use-case';
import { ListBookmarksUseCase } from './application/use-cases/list-bookmarks.use-case';
import { BookmarkHttpController } from './presenter/http/bookmark.http.controller';

@Module({
  imports: [AuthModule],
  controllers: [BookmarkHttpController],
  providers: [
    /** query-handlers */
    ListUserBookmarksQueryHandler,
    CountUserBookmarksQueryHandler,

    /** command-handlers */
    SaveBookmarkCommandHandler,
    RemoveBookmarkCommandHandler,
    BulkCreateBookmarksCommandHandler,

    /** use-cases */
    ListBookmarksUseCase,
    CreateBookmarkUseCase,
    DeleteBookmarkUseCase,
    ImportBookmarksUseCase,
  ],
})
export class BookmarkModule {}
