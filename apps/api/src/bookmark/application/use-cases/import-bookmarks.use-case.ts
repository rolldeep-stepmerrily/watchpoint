import { TypedCommandBus, TypedQueryBus } from '@@cqrs';
import { Injectable } from '@nestjs/common';

import { BOOKMARK_LIMIT_PER_KIND } from '../../bookmark.error';
import { BOOKMARK_KINDS, type BookmarkKindValue } from '../../entities/bookmark.entity';
import { BulkCreateBookmarksCommand } from '../commands/bulk-create-bookmarks.command';
import { CountUserBookmarksQuery } from '../queries/count-user-bookmarks.query';

interface ImportBookmarksUseCaseProps {
  userId: number;
  items: Array<{ kind: BookmarkKindValue; targetId: string; metadata?: Record<string, unknown> }>;
}

interface ImportResult {
  inserted: number;
  skipped: number;
}

@Injectable()
export class ImportBookmarksUseCase {
  constructor(
    private readonly commandBus: TypedCommandBus<BulkCreateBookmarksCommand>,
    private readonly queryBus: TypedQueryBus<CountUserBookmarksQuery>,
  ) {}

  /**
   * 게스트 → 회원 전환 시 localStorage를 1회 흡수. 동작:
   * 1) kind별 현재 카운트 조회 → 남은 slot 계산
   * 2) 각 kind의 head N개만 추려서 `createMany skipDuplicates`로 적재
   * 3) `inserted` = 실제 insert된 건수, `skipped` = 요청 대비 차이 (중복/한도)
   */
  async execute(props: ImportBookmarksUseCaseProps): Promise<ImportResult> {
    const { userId, items } = props;

    if (items.length === 0) {
      return { inserted: 0, skipped: 0 };
    }

    const capped = await this.applyKindCaps(userId, items);
    const inserted = await this.commandBus.execute(new BulkCreateBookmarksCommand({ userId, items: capped }));

    return { inserted, skipped: items.length - inserted };
  }

  private async applyKindCaps(
    userId: number,
    items: ImportBookmarksUseCaseProps['items'],
  ): Promise<ImportBookmarksUseCaseProps['items']> {
    const remaining = new Map<BookmarkKindValue, number>();
    for (const kind of BOOKMARK_KINDS) {
      const count = await this.queryBus.execute(new CountUserBookmarksQuery({ userId, kind }));
      remaining.set(kind, Math.max(0, BOOKMARK_LIMIT_PER_KIND - count));
    }

    const result: ImportBookmarksUseCaseProps['items'] = [];
    for (const item of items) {
      const left = remaining.get(item.kind) ?? 0;
      if (left <= 0) {
        continue;
      }
      result.push(item);
      remaining.set(item.kind, left - 1);
    }
    return result;
  }
}
