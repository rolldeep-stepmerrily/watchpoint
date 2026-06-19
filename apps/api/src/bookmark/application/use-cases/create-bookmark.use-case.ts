import { TypedCommandBus, TypedQueryBus } from '@@cqrs';
import { AppException } from '@@exceptions';
import { Injectable } from '@nestjs/common';

import { BOOKMARK_ERRORS, BOOKMARK_LIMIT_PER_KIND } from '../../bookmark.error';
import type { BookmarkEntity, BookmarkKindValue } from '../../entities/bookmark.entity';
import { SaveBookmarkCommand } from '../commands/save-bookmark.command';
import { CountUserBookmarksQuery } from '../queries/count-user-bookmarks.query';

interface CreateBookmarkUseCaseProps {
  userId: number;
  kind: BookmarkKindValue;
  targetId: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class CreateBookmarkUseCase {
  constructor(
    private readonly commandBus: TypedCommandBus<SaveBookmarkCommand>,
    private readonly queryBus: TypedQueryBus<CountUserBookmarksQuery>,
  ) {}

  /**
   * kind별 한도(`BOOKMARK_LIMIT_PER_KIND`)를 넘어서면 `BOOKMARK_LIMIT_REACHED`.
   * 이미 같은 (userId, kind, targetId) 행이 있으면 metadata만 갱신 (upsert).
   */
  async execute(props: CreateBookmarkUseCaseProps): Promise<BookmarkEntity> {
    await this.assertUnderLimit(props.userId, props.kind);
    return await this.commandBus.execute(new SaveBookmarkCommand(props));
  }

  private async assertUnderLimit(userId: number, kind: BookmarkKindValue): Promise<void> {
    const count = await this.queryBus.execute(new CountUserBookmarksQuery({ userId, kind }));
    if (count >= BOOKMARK_LIMIT_PER_KIND) {
      throw new AppException(BOOKMARK_ERRORS.LIMIT_REACHED);
    }
  }
}
