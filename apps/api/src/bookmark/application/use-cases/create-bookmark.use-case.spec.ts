import { AppException } from '@@exceptions';

import { BOOKMARK_ERRORS, BOOKMARK_LIMIT_PER_KIND } from '../../bookmark.error';
import { CreateBookmarkUseCase } from './create-bookmark.use-case';

describe('CreateBookmarkUseCase', () => {
  const build = (count: number) => {
    const queryBus = { execute: jest.fn().mockResolvedValue(count) };
    const commandBus = {
      execute: jest.fn().mockResolvedValue({
        id: 1,
        kind: 'HERO',
        targetId: 'tracer',
        metadata: null,
        createdAt: new Date(),
      }),
    };
    return {
      queryBus,
      commandBus,
      // biome-ignore lint/suspicious/noExplicitAny: test double
      useCase: new CreateBookmarkUseCase(commandBus as any, queryBus as any),
    };
  };

  it('한도 미만이면 정상 생성', async () => {
    const { useCase, commandBus } = build(BOOKMARK_LIMIT_PER_KIND - 1);
    const result = await useCase.execute({ userId: 1, kind: 'HERO', targetId: 'tracer' });
    expect(result.targetId).toBe('tracer');
    expect(commandBus.execute).toHaveBeenCalledTimes(1);
  });

  it('한도에 도달하면 LIMIT_REACHED', async () => {
    const { useCase, commandBus } = build(BOOKMARK_LIMIT_PER_KIND);
    await expect(useCase.execute({ userId: 1, kind: 'HERO', targetId: 'tracer' })).rejects.toThrow(
      new AppException(BOOKMARK_ERRORS.LIMIT_REACHED),
    );
    expect(commandBus.execute).not.toHaveBeenCalled();
  });
});
