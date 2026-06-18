import { AppException } from '@@exceptions';

import { AUTH_ERRORS } from '../../auth.error';
import { LoginUseCase } from './login.use-case';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

const bcryptCompare = bcrypt.compare as unknown as jest.Mock;

describe('LoginUseCase', () => {
  const build = (
    overrides: Partial<{
      user: { id: number; email: string; password: string | null } | null;
      bcryptResult: boolean;
    }> = {},
  ): LoginUseCase => {
    const user = 'user' in overrides ? overrides.user : { id: 1, email: 'a@b.com', password: 'hash' };
    const queryBus = { execute: jest.fn().mockResolvedValue(user) };
    const commandBus = { execute: jest.fn().mockResolvedValue(undefined) };
    const jwtService = { sign: jest.fn().mockReturnValue('jwt') };
    const configService = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'REFRESH_TOKEN_TTL_DAYS') {
          return 7;
        }
        return `${key}-value`;
      }),
    };

    bcryptCompare.mockResolvedValue(overrides.bcryptResult ?? true);

    return new LoginUseCase(
      // biome-ignore lint/suspicious/noExplicitAny: test double
      commandBus as any,
      // biome-ignore lint/suspicious/noExplicitAny: test double
      queryBus as any,
      // biome-ignore lint/suspicious/noExplicitAny: test double
      jwtService as any,
      // biome-ignore lint/suspicious/noExplicitAny: test double
      configService as any,
    );
  };

  beforeEach(() => {
    bcryptCompare.mockReset();
  });

  it('유저가 없으면 INVALID_CREDENTIALS', async () => {
    const useCase = build({ user: null });

    await expect(useCase.execute({ bodyDto: { email: 'x@y.com', password: 'whatever' } })).rejects.toThrow(
      new AppException(AUTH_ERRORS.INVALID_CREDENTIALS),
    );
  });

  it('비밀번호 없는 계정(OAuth 전용)이면 INVALID_CREDENTIALS', async () => {
    const useCase = build({ user: { id: 1, email: 'a@b.com', password: null } });

    await expect(useCase.execute({ bodyDto: { email: 'a@b.com', password: 'whatever' } })).rejects.toThrow(
      new AppException(AUTH_ERRORS.INVALID_CREDENTIALS),
    );
  });

  it('비밀번호 mismatch면 INVALID_CREDENTIALS', async () => {
    const useCase = build({ bcryptResult: false });

    await expect(useCase.execute({ bodyDto: { email: 'a@b.com', password: 'wrong' } })).rejects.toThrow(
      new AppException(AUTH_ERRORS.INVALID_CREDENTIALS),
    );
  });

  it('정상 로그인 시 token 응답', async () => {
    const useCase = build();

    const result = await useCase.execute({ bodyDto: { email: 'a@b.com', password: 'correct' } });

    expect(result.accessToken).toBe('jwt');
    expect(result.refreshToken).toBe('jwt');
  });
});
