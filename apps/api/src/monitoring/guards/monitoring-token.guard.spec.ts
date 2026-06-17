import { AppException } from '@@exceptions';
import type { ExecutionContext } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';

import { MonitoringTokenGuard } from './monitoring-token.guard';

const buildContext = (key?: string): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ headers: { 'x-monitoring-key': key } }),
    }),
  }) as unknown as ExecutionContext;

const buildConfig = (configured?: string): ConfigService =>
  ({ get: jest.fn().mockReturnValue(configured) }) as unknown as ConfigService;

describe('MonitoringTokenGuard', () => {
  const validKey = 'a'.repeat(32);

  it('allows request when header matches configured key', () => {
    const guard = new MonitoringTokenGuard(buildConfig(validKey));

    expect(guard.canActivate(buildContext(validKey))).toBe(true);
  });

  it('throws FORBIDDEN when header is missing', () => {
    const guard = new MonitoringTokenGuard(buildConfig(validKey));

    expect(() => guard.canActivate(buildContext(undefined))).toThrow(AppException);
  });

  it('throws FORBIDDEN when header does not match', () => {
    const guard = new MonitoringTokenGuard(buildConfig(validKey));

    expect(() => guard.canActivate(buildContext('b'.repeat(32)))).toThrow(AppException);
  });

  it('throws FORBIDDEN when MONITORING_INGEST_KEY is not configured', () => {
    const guard = new MonitoringTokenGuard(buildConfig(undefined));

    expect(() => guard.canActivate(buildContext(validKey))).toThrow(AppException);
  });
});
