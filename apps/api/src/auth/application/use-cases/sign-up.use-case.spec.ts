import { AppException } from '@@exceptions';

import { AUTH_ERRORS } from '../../auth.error';
import { SignUpUseCase } from './sign-up.use-case';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
}));

describe('SignUpUseCase', () => {
  const buildDeps = (overrides: Partial<Record<string, unknown>> = {}): SignUpUseCase => {
    const commandBus = { execute: jest.fn().mockResolvedValue(undefined) };
    const queryBus = { execute: jest.fn().mockResolvedValue(null) };
    const jwtService = { sign: jest.fn().mockReturnValue('jwt') };
    const configService = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'REFRESH_TOKEN_TTL_DAYS') {
          return 7;
        }
        return `${key}-value`;
      }),
    };
    const prisma = { $transaction: jest.fn(async (fn: () => Promise<unknown>) => await fn()) };

    return new SignUpUseCase(
      // biome-ignore lint/suspicious/noExplicitAny: test double
      (overrides.commandBus ?? commandBus) as any,
      // biome-ignore lint/suspicious/noExplicitAny: test double
      (overrides.queryBus ?? queryBus) as any,
      // biome-ignore lint/suspicious/noExplicitAny: test double
      (overrides.jwtService ?? jwtService) as any,
      // biome-ignore lint/suspicious/noExplicitAny: test double
      (overrides.configService ?? configService) as any,
      // biome-ignore lint/suspicious/noExplicitAny: test double
      (overrides.prisma ?? prisma) as any,
    );
  };

  it('이메일 중복이면 EMAIL_ALREADY_EXISTS', async () => {
    const queryBus = { execute: jest.fn().mockResolvedValue({ id: 1, email: 'dup@example.com' }) };
    const useCase = buildDeps({ queryBus });

    await expect(useCase.execute({ bodyDto: { email: 'dup@example.com', password: 'Aa1!aaaa' } })).rejects.toThrow(
      new AppException(AUTH_ERRORS.EMAIL_ALREADY_EXISTS),
    );
  });

  it('정상 가입 시 토큰 발급 후 응답', async () => {
    const commandBus = {
      execute: jest.fn().mockImplementation((cmd: { constructor: { name: string } }) => {
        if (cmd.constructor.name === 'SaveUserCommand') {
          return Promise.resolve({ id: 42, email: 'new@example.com' });
        }
        return Promise.resolve(undefined);
      }),
    };
    const useCase = buildDeps({ commandBus });

    const result = await useCase.execute({
      bodyDto: { email: 'new@example.com', password: 'Aa1!aaaa', name: 'Alice' },
    });

    expect(result.accessToken).toBe('jwt');
    expect(result.refreshToken).toBe('jwt');
  });
});
