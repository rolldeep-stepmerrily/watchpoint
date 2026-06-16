import type { ResponseCache } from '@@cache';

import type { OverFastClient, OverFastSearchEntry, OverFastSearchResult } from '../../infrastructure/overfast.client';
import { SearchCareerUseCase } from './search-career.use-case';

const passthroughCache: Pick<ResponseCache, 'wrap'> = {
  wrap: async <T>(_key: string, _ttl: number, loader: () => Promise<T>): Promise<T> => await loader(),
};

const buildEntry = (overrides: Partial<OverFastSearchEntry> = {}): OverFastSearchEntry => ({
  player_id: 'TeKrop-2217',
  name: 'TeKrop',
  avatar: 'https://cdn/avatar.png',
  namecard: null,
  last_updated_at: null,
  privacy: 'public',
  ...overrides,
});

const buildClient = (result: OverFastSearchResult): OverFastClient =>
  ({
    searchPlayers: jest.fn().mockResolvedValue(result),
  }) as unknown as OverFastClient;

describe('SearchCareerUseCase', () => {
  it('maps OverFast search entries to DTOs (snake → camel, private flag)', async () => {
    const upstream: OverFastSearchResult = {
      total: 2,
      results: [
        buildEntry({ player_id: 'A-1', name: 'A', privacy: 'public' }),
        buildEntry({ player_id: 'B-2', name: 'B', private: true, privacy: undefined }),
      ],
    };
    const useCase = new SearchCareerUseCase(buildClient(upstream), passthroughCache as ResponseCache);

    const result = await useCase.execute({ q: 'a', page: 1, pageSize: 20 });

    expect(result.total).toBe(2);
    expect(result.results).toHaveLength(2);
    expect(result.results[0]).toMatchObject({ playerId: 'A-1', name: 'A', private: false });
    expect(result.results[1]).toMatchObject({ playerId: 'B-2', name: 'B', private: true });
  });

  it('passes pagination offset = (page-1)*pageSize to OverFastClient', async () => {
    const client = buildClient({ total: 0, results: [] });
    const useCase = new SearchCareerUseCase(client, passthroughCache as ResponseCache);

    await useCase.execute({ q: 'a', page: 3, pageSize: 10 });

    expect(client.searchPlayers).toHaveBeenCalledWith('a', 10, 20);
  });

  it('normalises last_updated_at epoch seconds to ISO string', async () => {
    const upstream: OverFastSearchResult = {
      total: 1,
      results: [buildEntry({ last_updated_at: 1_700_000_000 })],
    };
    const useCase = new SearchCareerUseCase(buildClient(upstream), passthroughCache as ResponseCache);

    const result = await useCase.execute({ q: 'a', page: 1, pageSize: 20 });

    expect(result.results[0]?.lastUpdatedAt).toBe(new Date(1_700_000_000 * 1000).toISOString());
  });

  it('passes through last_updated_at when already string', async () => {
    const upstream: OverFastSearchResult = {
      total: 1,
      results: [buildEntry({ last_updated_at: '2026-06-15T10:00:00Z' })],
    };
    const useCase = new SearchCareerUseCase(buildClient(upstream), passthroughCache as ResponseCache);

    const result = await useCase.execute({ q: 'a', page: 1, pageSize: 20 });

    expect(result.results[0]?.lastUpdatedAt).toBe('2026-06-15T10:00:00Z');
  });

  it('returns null lastUpdatedAt when upstream value is null', async () => {
    const upstream: OverFastSearchResult = {
      total: 1,
      results: [buildEntry({ last_updated_at: null })],
    };
    const useCase = new SearchCareerUseCase(buildClient(upstream), passthroughCache as ResponseCache);

    const result = await useCase.execute({ q: 'a', page: 1, pageSize: 20 });

    expect(result.results[0]?.lastUpdatedAt).toBeNull();
  });
});
