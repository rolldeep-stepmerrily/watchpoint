import { PrismaService } from '@@db';
import { type IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';

import type { BookmarkKindValue } from '../../entities/bookmark.entity';

interface CountUserBookmarksQueryProps {
  userId: number;
  kind: BookmarkKindValue;
}

export class CountUserBookmarksQuery extends Query<number> {
  constructor(public readonly props: CountUserBookmarksQueryProps) {
    super();
  }
}

@QueryHandler(CountUserBookmarksQuery)
export class CountUserBookmarksQueryHandler implements IQueryHandler<CountUserBookmarksQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: CountUserBookmarksQuery): Promise<number> {
    return await this.prisma.bookmark.count({
      where: { userId: query.props.userId, kind: query.props.kind },
    });
  }
}
