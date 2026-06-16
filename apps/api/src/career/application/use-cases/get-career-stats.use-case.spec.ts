import type { ResponseCache } from '@@cache';

import type { OverFastClient, OverFastStatsBlock, OverFastStatsSummary } from '../../infrastructure/overfast.client';
import { GetCareerStatsUseCase } from './get-career-stats.use-case';

const passthroughCache: Pick<ResponseCache, 'wrap'> = {
  wrap: async <T>(_key: string, _ttl: number, loader: () => Promise<T>): Promise<T> => await loader(),
};

const buildBlock = (overrides: Partial<OverFastStatsBlock> = {}): OverFastStatsBlock => ({
  games_played: 100,
  games_won: 55,
  games_lost: 45,
  time_played: 36000,
  winrate: 55,
  kda: 2.5,
  total: { eliminations: 1000, assists: 300, deaths: 400, damage: 500000, healing: 0 },
  average: { eliminations: 10, assists: 3, deaths: 4, damage: 5000, healing: 0 },
  ...overrides,
});

const buildClient = (summary: OverFastStatsSummary): OverFastClient =>
  ({
    getPlayerStats: jest.fn().mockResolvedValue(summary),
  }) as unknown as OverFastClient;

describe('GetCareerStatsUseCase', () => {
  it('maps general/roles/heroes snake_case → camelCase', async () => {
    const upstream: OverFastStatsSummary = {
      general: buildBlock({ games_played: 200, winrate: 60 }),
      roles: {
        tank: buildBlock({ games_played: 100 }),
        damage: null,
        support: buildBlock({ games_played: 80 }),
      },
      heroes: {
        ana: buildBlock({ games_played: 50 }),
        'wrecking-ball': buildBlock({ games_played: 30 }),
      },
    };
    const useCase = new GetCareerStatsUseCase(buildClient(upstream), passthroughCache as ResponseCache);

    const result = await useCase.execute({ playerId: 'TeKrop-2217' });

    expect(result.playerId).toBe('TeKrop-2217');
    expect(result.general?.gamesPlayed).toBe(200);
    expect(result.general?.winrate).toBe(60);
    expect(result.roles.tank?.gamesPlayed).toBe(100);
    expect(result.roles.damage).toBeNull();
    expect(result.roles.support?.gamesPlayed).toBe(80);
  });

  it('returns hero entries sorted by gamesPlayed descending', async () => {
    const upstream: OverFastStatsSummary = {
      general: null,
      roles: null,
      heroes: {
        ana: buildBlock({ games_played: 30 }),
        ashe: buildBlock({ games_played: 100 }),
        bastion: buildBlock({ games_played: 10 }),
        'wrecking-ball': buildBlock({ games_played: 50 }),
      },
    };
    const useCase = new GetCareerStatsUseCase(buildClient(upstream), passthroughCache as ResponseCache);

    const result = await useCase.execute({ playerId: 'X-1' });

    expect(result.heroes.map((h) => h.codename)).toEqual(['ashe', 'wrecking-ball', 'ana', 'bastion']);
  });

  it('returns empty heroes array when upstream heroes is null', async () => {
    const useCase = new GetCareerStatsUseCase(
      buildClient({ general: null, roles: null, heroes: null }),
      passthroughCache as ResponseCache,
    );

    const result = await useCase.execute({ playerId: 'X-1' });

    expect(result.heroes).toEqual([]);
    expect(result.general).toBeNull();
    expect(result.roles).toEqual({ tank: null, damage: null, support: null });
  });

  it('defaults missing block fields to 0 (winrate, kda, totals)', async () => {
    const partial = { games_played: 10 } as unknown as OverFastStatsBlock;
    const useCase = new GetCareerStatsUseCase(
      buildClient({ general: partial, roles: null, heroes: null }),
      passthroughCache as ResponseCache,
    );

    const result = await useCase.execute({ playerId: 'X-1' });

    expect(result.general?.winrate).toBe(0);
    expect(result.general?.kda).toBe(0);
    expect(result.general?.total).toEqual({ eliminations: 0, assists: 0, deaths: 0, damage: 0, healing: 0 });
    expect(result.general?.average).toEqual({ eliminations: 0, assists: 0, deaths: 0, damage: 0, healing: 0 });
  });
});
