import type { PrismaService } from '@@db';
import { AppException } from '@@exceptions';
import type { RedisService } from '@@redis';

import { RecordMonitoringLogUseCase } from './record-monitoring-log.use-case';

interface RedisStub {
  set: jest.Mock;
}

const buildRedis = (setReply: 'OK' | null): { service: RedisService; stub: RedisStub } => {
  const stub: RedisStub = { set: jest.fn().mockResolvedValue(setReply) };
  const service = { getClient: () => stub } as unknown as RedisService;
  return { service, stub };
};

const buildPrisma = (createImpl: jest.Mock): PrismaService =>
  ({ monitoringLog: { create: createImpl } }) as unknown as PrismaService;

describe('RecordMonitoringLogUseCase', () => {
  const baseInput = {
    kind: 'prod-smoke',
    status: 'pass' as const,
    total: 23,
    passed: 23,
    failed: 0,
  };

  it('persists the log and returns id + runAt when rate-limit key is free', async () => {
    const runAt = new Date('2026-06-17T16:00:00Z');
    const create = jest.fn().mockResolvedValue({ id: 1, runAt });
    const { service: redis, stub } = buildRedis('OK');

    const useCase = new RecordMonitoringLogUseCase(buildPrisma(create), redis);
    const result = await useCase.execute({ ...baseInput, durationMs: 1200 });

    expect(stub.set).toHaveBeenCalledWith('monitoring-log:rate:prod-smoke', '1', 'EX', 600, 'NX');
    expect(create).toHaveBeenCalledWith({
      data: {
        kind: 'prod-smoke',
        status: 'pass',
        total: 23,
        passed: 23,
        failed: 0,
        durationMs: 1200,
        fixPrUrl: null,
        notes: null,
      },
      select: { id: true, runAt: true },
    });
    expect(result).toEqual({ id: 1, runAt: runAt.toISOString() });
  });

  it('throws RATE_LIMITED when the rate-limit key already exists', async () => {
    const create = jest.fn();
    const { service: redis } = buildRedis(null);
    const useCase = new RecordMonitoringLogUseCase(buildPrisma(create), redis);

    await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(AppException);
    await expect(useCase.execute(baseInput)).rejects.toMatchObject({ status: 429 });
    expect(create).not.toHaveBeenCalled();
  });

  it('coerces optional fields to null when omitted', async () => {
    const create = jest.fn().mockResolvedValue({ id: 2, runAt: new Date() });
    const { service: redis } = buildRedis('OK');

    const useCase = new RecordMonitoringLogUseCase(buildPrisma(create), redis);
    await useCase.execute(baseInput);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ durationMs: null, fixPrUrl: null, notes: null }),
      }),
    );
  });
});
