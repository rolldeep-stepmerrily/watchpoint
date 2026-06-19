import { BOOKMARK_LIMIT_PER_KIND } from '../../bookmark.error';
import type { BookmarkKindValue } from '../../entities/bookmark.entity';
import { ImportBookmarksUseCase } from './import-bookmarks.use-case';

describe('ImportBookmarksUseCase', () => {
  const build = (counts: Record<BookmarkKindValue, number>, inserted: number) => {
    const queryBus = {
      execute: jest.fn((q: { props: { kind: BookmarkKindValue } }) => Promise.resolve(counts[q.props.kind])),
    };
    const commandBus = { execute: jest.fn().mockResolvedValue(inserted) };
    return {
      commandBus,
      queryBus,
      // biome-ignore lint/suspicious/noExplicitAny: test double
      useCase: new ImportBookmarksUseCase(commandBus as any, queryBus as any),
    };
  };

  it('빈 items면 즉시 0/0 반환, 커맨드 호출 없음', async () => {
    const { useCase, commandBus } = build({ HERO: 0, PLAYER: 0 }, 0);
    const result = await useCase.execute({ userId: 1, items: [] });
    expect(result).toEqual({ inserted: 0, skipped: 0 });
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('남은 slot보다 많이 들어오면 truncate해서 BulkCreate에 전달', async () => {
    const remaining = 2;
    const items = Array.from({ length: 5 }, (_, i) => ({ kind: 'HERO' as const, targetId: `h${i}` }));
    const { useCase, commandBus } = build({ HERO: BOOKMARK_LIMIT_PER_KIND - remaining, PLAYER: 0 }, remaining);

    const result = await useCase.execute({ userId: 1, items });

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const sent = (commandBus.execute.mock.calls[0][0] as { props: { items: unknown[] } }).props.items;
    expect(sent).toHaveLength(remaining);
    expect(result).toEqual({ inserted: remaining, skipped: items.length - remaining });
  });

  it('kind별 capacity가 다르면 각자 차감', async () => {
    const items = [
      { kind: 'HERO' as const, targetId: 'h1' },
      { kind: 'HERO' as const, targetId: 'h2' },
      { kind: 'PLAYER' as const, targetId: 'p1' },
    ];
    const { useCase, commandBus } = build({ HERO: BOOKMARK_LIMIT_PER_KIND - 1, PLAYER: 0 }, 2);

    await useCase.execute({ userId: 1, items });

    const sent = (commandBus.execute.mock.calls[0][0] as { props: { items: Array<{ kind: string }> } }).props.items;
    expect(sent.filter((i) => i.kind === 'HERO')).toHaveLength(1);
    expect(sent.filter((i) => i.kind === 'PLAYER')).toHaveLength(1);
  });
});
