import { TypedQueryBus } from '@@cqrs';
import { Injectable } from '@nestjs/common';

import type { BookmarkEntity, BookmarkKindValue } from '../../entities/bookmark.entity';
import { ListUserBookmarksQuery } from '../queries/list-user-bookmarks.query';

interface ListBookmarksUseCaseProps {
  userId: number;
  kind?: BookmarkKindValue;
}

@Injectable()
export class ListBookmarksUseCase {
  constructor(private readonly queryBus: TypedQueryBus<ListUserBookmarksQuery>) {}

  async execute(props: ListBookmarksUseCaseProps): Promise<BookmarkEntity[]> {
    return await this.queryBus.execute(new ListUserBookmarksQuery(props));
  }
}
