import type { NextFunction, Request, Response } from 'express';

import { RequestIdMiddleware } from './request-id.middleware';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const buildReq = (header: string | undefined): Request => {
  return {
    header: jest
      .fn()
      .mockImplementation((name: string) => (name.toLowerCase() === 'x-request-id' ? header : undefined)),
  } as unknown as Request;
};

const buildRes = (): Response =>
  ({
    setHeader: jest.fn(),
  }) as unknown as Response;

describe('RequestIdMiddleware', () => {
  const middleware = new RequestIdMiddleware();

  it('trusts incoming X-Request-Id header', () => {
    const req = buildReq('client-supplied-id');
    const res = buildRes();
    const next: NextFunction = jest.fn();

    middleware.use(req, res, next);

    expect(req.requestId).toBe('client-supplied-id');
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', 'client-supplied-id');
    expect(next).toHaveBeenCalled();
  });

  it('generates UUID v4 when header missing', () => {
    const req = buildReq(undefined);
    const res = buildRes();

    middleware.use(req, res, jest.fn());

    expect(req.requestId).toMatch(UUID_V4_REGEX);
  });

  it('generates UUID v4 when header is empty string', () => {
    const req = buildReq('');
    const res = buildRes();

    middleware.use(req, res, jest.fn());

    expect(req.requestId).toMatch(UUID_V4_REGEX);
  });

  it('rejects header longer than 128 chars and falls back to UUID', () => {
    const tooLong = 'x'.repeat(129);
    const req = buildReq(tooLong);
    const res = buildRes();

    middleware.use(req, res, jest.fn());

    expect(req.requestId).not.toBe(tooLong);
    expect(req.requestId).toMatch(UUID_V4_REGEX);
  });

  it('accepts header exactly at 128 char boundary', () => {
    const boundary = 'x'.repeat(128);
    const req = buildReq(boundary);
    const res = buildRes();

    middleware.use(req, res, jest.fn());

    expect(req.requestId).toBe(boundary);
  });
});
