import type { ResponseCache } from '@@cache';

import type {
  OverFastClient,
  OverFastPlatformRanks,
  OverFastPlayerSummary,
  OverFastRank,
} from '../../infrastructure/overfast.client';
import { GetCareerSummaryUseCase } from './get-career-summary.use-case';

const passthroughCache: Pick<ResponseCache, 'wrap'> = {
  wrap: async <T>(_key: string, _ttl: number, loader: () => Promise<T>): Promise<T> => await loader(),
};

const buildSummary = (overrides: Partial<OverFastPlayerSummary> = {}): OverFastPlayerSummary => ({
  player_id: 'TeKrop-2217',
  battleTag: undefined,
  username: undefined,
  name: 'TeKrop',
  avatar: 'https://cdn/avatar.png',
  namecard: 'https://cdn/namecard.png',
  title: 'Data Broker',
  endorsement_level: 3,
  competitive: null,
  privacy: 'public',
  ...overrides,
});

const buildRank = (overrides: Partial<OverFastRank> = {}): OverFastRank => ({
  division: 'silver',
  tier: 4,
  role_icon: 'https://cdn/role.svg',
  rank_icon: 'https://cdn/rank.png',
  ...overrides,
});

const buildClient = (summary: OverFastPlayerSummary): OverFastClient =>
  ({
    getPlayerSummary: jest.fn().mockResolvedValue(summary),
  }) as unknown as OverFastClient;

describe('GetCareerSummaryUseCase', () => {
  it('maps OverFast division(string) → DTO tier and OverFast tier(number) → DTO division', async () => {
    const summary = buildSummary({
      competitive: {
        pc: {
          tank: null,
          damage: null,
          support: buildRank({ division: 'silver', tier: 4 }),
        },
        console: null,
      },
    });
    const useCase = new GetCareerSummaryUseCase(buildClient(summary), passthroughCache as ResponseCache);

    const result = await useCase.execute({ playerId: 'TeKrop-2217' });
    const support = result.competitive?.pc?.support;

    expect(support).not.toBeNull();
    expect(support?.tier).toBe('silver');
    expect(support?.division).toBe(4);
    expect(support?.roleIcon).toBe('https://cdn/role.svg');
    expect(support?.rankIcon).toBe('https://cdn/rank.png');
  });

  it('preserves null role ranks (tank/damage = null)', async () => {
    const summary = buildSummary({
      competitive: {
        pc: { tank: null, damage: null, support: buildRank() },
        console: null,
      },
    });
    const useCase = new GetCareerSummaryUseCase(buildClient(summary), passthroughCache as ResponseCache);

    const result = await useCase.execute({ playerId: 'TeKrop-2217' });

    expect(result.competitive?.pc?.tank).toBeNull();
    expect(result.competitive?.pc?.damage).toBeNull();
    expect(result.competitive?.console).toBeNull();
  });

  it('flags private profile when privacy = "private"', async () => {
    const summary = buildSummary({ privacy: 'private' });
    const useCase = new GetCareerSummaryUseCase(buildClient(summary), passthroughCache as ResponseCache);

    const result = await useCase.execute({ playerId: 'TeKrop-2217' });

    expect(result.private).toBe(true);
  });

  it('flags private profile when private = true (alternate shape)', async () => {
    const summary = buildSummary({ private: true });
    const useCase = new GetCareerSummaryUseCase(buildClient(summary), passthroughCache as ResponseCache);

    const result = await useCase.execute({ playerId: 'TeKrop-2217' });

    expect(result.private).toBe(true);
  });

  it('reconstructs battleTag from playerId tail (-NNNN → #NNNN)', async () => {
    const summary = buildSummary({ player_id: 'TeKrop-2217', battleTag: undefined });
    const useCase = new GetCareerSummaryUseCase(buildClient(summary), passthroughCache as ResponseCache);

    const result = await useCase.execute({ playerId: 'TeKrop-2217' });

    expect(result.battleTag).toBe('TeKrop#2217');
  });

  it('keeps username-only playerId as-is when no #NNNN tail', async () => {
    const summary = buildSummary({ player_id: 'OnlyName', battleTag: undefined });
    const useCase = new GetCareerSummaryUseCase(buildClient(summary), passthroughCache as ResponseCache);

    const result = await useCase.execute({ playerId: 'OnlyName' });

    expect(result.battleTag).toBe('OnlyName');
  });

  it('returns null competitive when upstream competitive is null', async () => {
    const summary = buildSummary({ competitive: null });
    const useCase = new GetCareerSummaryUseCase(buildClient(summary), passthroughCache as ResponseCache);

    const result = await useCase.execute({ playerId: 'TeKrop-2217' });

    expect(result.competitive).toBeNull();
  });

  it('handles null tier on rank (unranked sub-division)', async () => {
    const ranks: OverFastPlatformRanks = {
      tank: null,
      damage: null,
      support: buildRank({ division: 'ultimate', tier: null }),
    };
    const summary = buildSummary({ competitive: { pc: ranks, console: null } });
    const useCase = new GetCareerSummaryUseCase(buildClient(summary), passthroughCache as ResponseCache);

    const result = await useCase.execute({ playerId: 'TeKrop-2217' });

    expect(result.competitive?.pc?.support?.tier).toBe('ultimate');
    expect(result.competitive?.pc?.support?.division).toBeNull();
  });
});
