import { PrismaService } from '@@db';
import type { Prisma } from '@@prisma';
import { Command, CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import type { BookmarkKindValue } from '../../entities/bookmark.entity';

interface BulkCreateBookmarksCommandProps {
  userId: number;
  items: Array<{ kind: BookmarkKindValue; targetId: string; metadata?: Record<string, unknown> }>;
}

export class BulkCreateBookmarksCommand extends Command<number> {
  constructor(public readonly props: BulkCreateBookmarksCommandProps) {
    super();
  }
}

@CommandHandler(BulkCreateBookmarksCommand)
export class BulkCreateBookmarksCommandHandler implements ICommandHandler<BulkCreateBookmarksCommand> {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * `skipDuplicates`로 unique 충돌 자동 무시. 반환은 실제 insert된 건수.
   */
  async execute(command: BulkCreateBookmarksCommand): Promise<number> {
    const { userId, items } = command.props;
    if (items.length === 0) {
      return 0;
    }

    const data: Prisma.BookmarkCreateManyInput[] = items.map((item) => {
      const base = { userId, kind: item.kind, targetId: item.targetId };
      return item.metadata ? { ...base, metadata: item.metadata as Prisma.InputJsonValue } : base;
    });

    const { count } = await this.prisma.bookmark.createMany({
      data,
      skipDuplicates: true,
    });

    return count;
  }
}
