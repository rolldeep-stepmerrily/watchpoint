import { PrismaService } from '@@db';
import type { Prisma } from '@@prisma';
import { Command, CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { BookmarkEntity, type BookmarkKindValue } from '../../entities/bookmark.entity';

interface SaveBookmarkCommandProps {
  userId: number;
  kind: BookmarkKindValue;
  targetId: string;
  metadata?: Record<string, unknown>;
}

export class SaveBookmarkCommand extends Command<BookmarkEntity> {
  constructor(public readonly props: SaveBookmarkCommandProps) {
    super();
  }
}

@CommandHandler(SaveBookmarkCommand)
export class SaveBookmarkCommandHandler implements ICommandHandler<SaveBookmarkCommand> {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * `(userId, kind, targetId)` 유니크 위에서 upsert — 이미 있으면 metadata만 갱신.
   * 같은 북마크 다시 토글 시 createdAt이 보존되도록 update 시 createdAt 미터치.
   * metadata가 undefined면 Prisma가 해당 필드를 건드리지 않음 (기존 값 보존).
   */
  async execute(command: SaveBookmarkCommand): Promise<BookmarkEntity> {
    const { userId, kind, targetId, metadata } = command.props;

    const metadataInput = metadata as Prisma.InputJsonValue | undefined;
    const row = await this.prisma.bookmark.upsert({
      where: { userId_kind_targetId: { userId, kind, targetId } },
      create: { userId, kind, targetId, ...(metadataInput !== undefined && { metadata: metadataInput }) },
      update: { ...(metadataInput !== undefined && { metadata: metadataInput }) },
    });

    return {
      id: row.id,
      kind: row.kind,
      targetId: row.targetId,
      metadata: (row.metadata ?? null) as Record<string, unknown> | null,
      createdAt: row.createdAt,
    };
  }
}
