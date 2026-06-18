import { AppException } from '@@exceptions';
import type { ExecutionContext } from '@nestjs/common';

import { AUTH_ERRORS } from '../auth.error';
import { AdminGuard } from './admin.guard';

describe('AdminGuard', () => {
  const buildContext = (user: object | undefined): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  it('user가 없으면 FORBIDDEN', () => {
    const guard = new AdminGuard();
    expect(() => guard.canActivate(buildContext(undefined))).toThrow(new AppException(AUTH_ERRORS.FORBIDDEN));
  });

  it('role이 USER면 FORBIDDEN', () => {
    const guard = new AdminGuard();
    expect(() => guard.canActivate(buildContext({ id: 1, role: 'USER' }))).toThrow(
      new AppException(AUTH_ERRORS.FORBIDDEN),
    );
  });

  it('role이 ADMIN이면 true', () => {
    const guard = new AdminGuard();
    expect(guard.canActivate(buildContext({ id: 1, role: 'ADMIN' }))).toBe(true);
  });
});
