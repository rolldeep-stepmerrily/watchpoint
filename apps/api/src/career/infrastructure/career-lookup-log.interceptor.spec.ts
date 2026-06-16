import type { PrismaService } from '@@db';
import { AppException } from '@@exceptions';
import { type CallHandler, type ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import type { Request } from 'express';
import { firstValueFrom, type Observable, of, throwError } from 'rxjs';

import { CAREER_ERRORS } from '../career.error';
import { CareerLookupLogInterceptor } from './career-lookup-log.interceptor';

interface WriteEntry {
  requestId: string;
  eventType: 'SEARCH' | 'SUMMARY';
  query: string;
  ip: string;
  success: boolean;
  errorCode: string | null;
}

const buildPrisma = (): { service: PrismaService; create: jest.Mock } => {
  const create = jest.fn().mockResolvedValue({});
  const service = { careerLookupLog: { create } } as unknown as PrismaService;
  return { service, create };
};

const buildContext = (req: Partial<Request>): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => req as Request }),
  }) as unknown as ExecutionContext;

const buildRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
  requestId: 'req-1',
  params: {},
  query: {},
  header: jest.fn().mockReturnValue(undefined),
  ip: '1.2.3.4',
  ...overrides,
});

const buildHandler = (observable: Observable<unknown>): CallHandler =>
  ({
    handle: () => observable as Observable<never>,
  }) as CallHandler;

const lastWriteEntry = (create: jest.Mock): WriteEntry => {
  const arg = create.mock.calls[0]?.[0] as { data: WriteEntry };
  return arg.data;
};

describe('CareerLookupLogInterceptor', () => {
  it('writes SUMMARY entry on success when playerId param present', async () => {
    const { service, create } = buildPrisma();
    const interceptor = new CareerLookupLogInterceptor(service);
    const req = buildRequest({ params: { playerId: 'TeKrop-2217' } });
    const result$ = interceptor.intercept(buildContext(req), buildHandler(of({ ok: true })));

    await firstValueFrom(result$);

    expect(create).toHaveBeenCalledTimes(1);
    expect(lastWriteEntry(create)).toMatchObject({
      requestId: 'req-1',
      eventType: 'SUMMARY',
      query: 'TeKrop-2217',
      ip: '1.2.3.4',
      success: true,
      errorCode: null,
    });
  });

  it('writes SEARCH entry with q query when no playerId', async () => {
    const { service, create } = buildPrisma();
    const interceptor = new CareerLookupLogInterceptor(service);
    const req = buildRequest({ query: { q: 'tekrop' } });

    await firstValueFrom(interceptor.intercept(buildContext(req), buildHandler(of([]))));

    expect(lastWriteEntry(create)).toMatchObject({ eventType: 'SEARCH', query: 'tekrop' });
  });

  it('prefers X-Forwarded-For first IP over req.ip', async () => {
    const { service, create } = buildPrisma();
    const interceptor = new CareerLookupLogInterceptor(service);
    const header = jest.fn().mockImplementation((name: string) => {
      if (name.toLowerCase() === 'x-forwarded-for') {
        return '10.0.0.1, 1.2.3.4';
      }
      return undefined;
    });
    const req = buildRequest({ query: { q: 'a' }, header, ip: '127.0.0.1' });

    await firstValueFrom(interceptor.intercept(buildContext(req), buildHandler(of([]))));

    expect(lastWriteEntry(create).ip).toBe('10.0.0.1');
  });

  it('extracts AppException errorCode on failure', async () => {
    const { service, create } = buildPrisma();
    const interceptor = new CareerLookupLogInterceptor(service);
    const req = buildRequest({ params: { playerId: 'X-1' } });

    const stream = interceptor.intercept(
      buildContext(req),
      buildHandler(throwError(() => new AppException(CAREER_ERRORS.NOT_FOUND))),
    );

    await expect(firstValueFrom(stream)).rejects.toBeInstanceOf(AppException);

    expect(lastWriteEntry(create)).toMatchObject({ success: false, errorCode: 'CAREER_NOT_FOUND' });
  });

  it('falls back to HTTP_<status> when HttpException has no errorCode', async () => {
    const { service, create } = buildPrisma();
    const interceptor = new CareerLookupLogInterceptor(service);
    const req = buildRequest({ params: { playerId: 'X-1' } });

    const stream = interceptor.intercept(
      buildContext(req),
      buildHandler(throwError(() => new HttpException('boom', HttpStatus.BAD_REQUEST))),
    );
    await expect(firstValueFrom(stream)).rejects.toBeInstanceOf(HttpException);

    expect(lastWriteEntry(create).errorCode).toBe('HTTP_400');
  });

  it('marks errorCode UNKNOWN for non-HttpException', async () => {
    const { service, create } = buildPrisma();
    const interceptor = new CareerLookupLogInterceptor(service);
    const req = buildRequest({ params: { playerId: 'X-1' } });

    const stream = interceptor.intercept(buildContext(req), buildHandler(throwError(() => new Error('raw'))));
    await expect(firstValueFrom(stream)).rejects.toThrow('raw');

    expect(lastWriteEntry(create).errorCode).toBe('UNKNOWN');
  });

  it('does not block response when prisma write rejects', async () => {
    const create = jest.fn().mockRejectedValue(new Error('db down'));
    const service = { careerLookupLog: { create } } as unknown as PrismaService;
    const interceptor = new CareerLookupLogInterceptor(service);
    const req = buildRequest({ params: { playerId: 'X-1' } });

    await expect(
      firstValueFrom(interceptor.intercept(buildContext(req), buildHandler(of({ ok: true })))),
    ).resolves.toEqual({ ok: true });
  });
});
