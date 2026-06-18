import { AppException } from '@@exceptions';

import { USERS_ERRORS } from '../../users.error';
import { ChangePasswordUseCase } from './change-password.use-case';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

const bcryptCompare = bcrypt.compare as unknown as jest.Mock;
const bcryptHash = bcrypt.hash as unknown as jest.Mock;

describe('ChangePasswordUseCase', () => {
  const build = (
    overrides: Partial<{
      user: { id: number; password: string | null } | null;
      bcryptCompareSeq: boolean[];
    }> = {},
  ): { useCase: ChangePasswordUseCase; commandBusExecute: jest.Mock } => {
    const user = 'user' in overrides ? overrides.user : { id: 1, password: 'hash' };
    const queryBus = { execute: jest.fn().mockResolvedValue(user) };
    const commandBusExecute = jest.fn().mockResolvedValue(undefined);
    const commandBus = { execute: commandBusExecute };

    const seq = overrides.bcryptCompareSeq ?? [true, false];
    let i = 0;
    bcryptCompare.mockImplementation(async () => seq[i++] ?? false);
    bcryptHash.mockResolvedValue('new-hash');

    const useCase = new ChangePasswordUseCase(
      // biome-ignore lint/suspicious/noExplicitAny: test double
      commandBus as any,
      // biome-ignore lint/suspicious/noExplicitAny: test double
      queryBus as any,
    );

    return { useCase, commandBusExecute };
  };

  beforeEach(() => {
    bcryptCompare.mockReset();
    bcryptHash.mockReset();
  });

  it('비밀번호 미설정 계정(OAuth 전용)이면 NO_PASSWORD', async () => {
    const { useCase } = build({ user: { id: 1, password: null } });

    await expect(
      useCase.execute({ userId: 1, bodyDto: { currentPassword: 'a', newPassword: 'Aa1!aaaa' } }),
    ).rejects.toThrow(new AppException(USERS_ERRORS.NO_PASSWORD));
  });

  it('현재 비밀번호 mismatch면 WRONG_PASSWORD', async () => {
    const { useCase } = build({ bcryptCompareSeq: [false] });

    await expect(
      useCase.execute({ userId: 1, bodyDto: { currentPassword: 'wrong', newPassword: 'Aa1!aaaa' } }),
    ).rejects.toThrow(new AppException(USERS_ERRORS.WRONG_PASSWORD));
  });

  it('새 비밀번호가 기존과 동일하면 PASSWORD_SAME', async () => {
    const { useCase } = build({ bcryptCompareSeq: [true, true] });

    await expect(
      useCase.execute({ userId: 1, bodyDto: { currentPassword: 'same', newPassword: 'Aa1!aaaa' } }),
    ).rejects.toThrow(new AppException(USERS_ERRORS.PASSWORD_SAME));
  });

  it('정상 변경 시 새 hash로 업데이트', async () => {
    const { useCase, commandBusExecute } = build({ bcryptCompareSeq: [true, false] });

    await useCase.execute({ userId: 1, bodyDto: { currentPassword: 'right', newPassword: 'Aa1!aaaa' } });

    expect(commandBusExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({ userId: 1, hashedPassword: 'new-hash' }),
      }),
    );
  });
});
