import { PrismaService } from '@@db';
import { Command, CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import type { BookmarkKindValue } from '../../entities/bookmark.entity';

interface RemoveBookmarkCommandProps {
  userId: number;
  kind: BookmarkKindValue;
  targetId: string;
}

export class RemoveBookmarkCommand extends Command<boolean> {
  constructor(public readonly props: RemoveBookmarkCommandProps) {
    super();
  }
}

@CommandHandler(RemoveBookmarkCommand)
export class RemoveBookmarkCommandHandler implements ICommandHandler<RemoveBookmarkCommand> {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 존재하면 삭제 후 true, 없으면 false. 컨트롤러는 둘 다 204로 응답해도 충분 — 멱등.
   */
  async execute(command: RemoveBookmarkCommand): Promise<boolean> {
    const { userId, kind, targetId } = command.props;
    const { count } = await this.prisma.bookmark.deleteMany({
      where: { userId, kind, targetId },
    });
    return count > 0;
  }
}
