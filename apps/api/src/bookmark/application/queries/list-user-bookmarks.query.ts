import { PrismaService } from '@@db';
import { type IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';

import { BookmarkEntity, type BookmarkKindValue } from '../../entities/bookmark.entity';

interface ListUserBookmarksQueryProps {
  userId: number;
  kind?: BookmarkKindValue;
}

export class ListUserBookmarksQuery extends Query<BookmarkEntity[]> {
  constructor(public readonly props: ListUserBookmarksQueryProps) {
    super();
  }
}

@QueryHandler(ListUserBookmarksQuery)
export class ListUserBookmarksQueryHandler implements IQueryHandler<ListUserBookmarksQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListUserBookmarksQuery): Promise<BookmarkEntity[]> {
    const { userId, kind } = query.props;

    const rows = await this.prisma.bookmark.findMany({
      where: { userId, ...(kind && { kind }) },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      targetId: row.targetId,
      metadata: (row.metadata ?? null) as Record<string, unknown> | null,
      createdAt: row.createdAt,
    }));
  }
}
