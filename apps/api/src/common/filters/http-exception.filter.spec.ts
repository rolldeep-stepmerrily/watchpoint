import { AppException, GLOBAL_ERRORS } from '@@exceptions';
import { type ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

import { HttpExceptionFilter } from './http-exception.filter';

jest.mock('@sentry/nestjs', () => ({ captureException: jest.fn() }));

const buildHost = (): { host: ArgumentsHost; status: jest.Mock; json: jest.Mock } => {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const res = { status } as unknown as Response;
  const host = {
    switchToHttp: () => ({ getResponse: () => res }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
};

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  it('maps AppException to { statusCode, errorCode, message }', () => {
    const { host, status, json } = buildHost();
    filter.catch(
      new AppException({
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: 'CUSTOM_CODE',
        message: 'bad input',
      }),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith({ statusCode: 400, errorCode: 'CUSTOM_CODE', message: 'bad input' });
  });

  it('falls back to errorCodeByStatus when HttpException has no errorCode (BAD_REQUEST → INVALID_REQUEST)', () => {
    const { host, status, json } = buildHost();
    filter.catch(new HttpException('boom', HttpStatus.BAD_REQUEST), host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      errorCode: GLOBAL_ERRORS.INVALID_REQUEST.errorCode,
      message: 'boom',
    });
  });

  it('overrides message for TOO_MANY_REQUESTS regardless of inner message', () => {
    const { host, json } = buildHost();
    filter.catch(new HttpException('rate', HttpStatus.TOO_MANY_REQUESTS), host);

    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      errorCode: GLOBAL_ERRORS.TOO_MANY_REQUESTS.errorCode,
      message: GLOBAL_ERRORS.TOO_MANY_REQUESTS.message,
    });
  });

  it('maps Prisma P2002 to RESOURCE_CONFLICT', () => {
    const { host, status, json } = buildHost();
    filter.catch({ code: 'P2002', message: 'unique violation' }, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith({
      statusCode: GLOBAL_ERRORS.RESOURCE_CONFLICT.statusCode,
      errorCode: GLOBAL_ERRORS.RESOURCE_CONFLICT.errorCode,
      message: GLOBAL_ERRORS.RESOURCE_CONFLICT.message,
    });
  });

  it('maps Prisma P2025 to RESOURCE_NOT_FOUND', () => {
    const { host, json } = buildHost();
    filter.catch({ code: 'P2025', message: 'not found' }, host);

    expect(json).toHaveBeenCalledWith({
      statusCode: GLOBAL_ERRORS.RESOURCE_NOT_FOUND.statusCode,
      errorCode: GLOBAL_ERRORS.RESOURCE_NOT_FOUND.errorCode,
      message: GLOBAL_ERRORS.RESOURCE_NOT_FOUND.message,
    });
  });

  it('maps unknown Prisma code to DATABASE_ERROR', () => {
    const { host, json } = buildHost();
    filter.catch({ code: 'P9999', message: 'mystery' }, host);

    expect(json).toHaveBeenCalledWith({
      statusCode: GLOBAL_ERRORS.DATABASE_ERROR.statusCode,
      errorCode: GLOBAL_ERRORS.DATABASE_ERROR.errorCode,
      message: GLOBAL_ERRORS.DATABASE_ERROR.message,
    });
  });

  it('maps unknown thrown value to UNKNOWN_ERROR 500', () => {
    const { host, status, json } = buildHost();
    filter.catch(new Error('something exploded'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      errorCode: GLOBAL_ERRORS.UNKNOWN_ERROR.errorCode,
      message: GLOBAL_ERRORS.UNKNOWN_ERROR.message,
    });
  });
});
