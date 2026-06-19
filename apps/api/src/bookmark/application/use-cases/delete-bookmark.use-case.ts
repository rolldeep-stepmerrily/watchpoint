import { TypedCommandBus } from '@@cqrs';
import { Injectable } from '@nestjs/common';

import type { BookmarkKindValue } from '../../entities/bookmark.entity';
import { RemoveBookmarkCommand } from '../commands/remove-bookmark.command';

interface DeleteBookmarkUseCaseProps {
  userId: number;
  kind: BookmarkKindValue;
  targetId: string;
}

@Injectable()
export class DeleteBookmarkUseCase {
  constructor(private readonly commandBus: TypedCommandBus<RemoveBookmarkCommand>) {}

  /**
   * 멱등 delete — 존재 여부와 무관하게 정상 종료. 컨트롤러는 204로 응답.
   */
  async execute(props: DeleteBookmarkUseCaseProps): Promise<void> {
    await this.commandBus.execute(new RemoveBookmarkCommand(props));
  }
}
