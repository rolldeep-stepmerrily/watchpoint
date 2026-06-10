import { GLOBAL_ERRORS } from '@@exceptions';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { Response } from 'express';

interface IErrorResponse {
  message: string;
  errorCode?: string;
  [key: string]: unknown;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { statusCode, errorCode, message } = this.resolveError(exception);

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      Sentry.captureException(exception);
    }

    response.status(statusCode).json({ statusCode, errorCode, message });
  }

  /**
   * 예외를 SPEC 응답 형식 { statusCode, errorCode, message }로 변환
   *
   * @param {unknown} exception 처리할 예외
   * @returns {{ statusCode: number; errorCode: string; message: string }} 정규화된 에러 응답
   */
  private resolveError(exception: unknown): { statusCode: number; errorCode: string; message: string } {
    if (exception instanceof HttpException) {
      return this.resolveHttpException(exception);
    }

    if (this.isPrismaKnownError(exception)) {
      return this.resolvePrismaError(exception);
    }

    this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : exception);
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: GLOBAL_ERRORS.UNKNOWN_ERROR.errorCode,
      message: GLOBAL_ERRORS.UNKNOWN_ERROR.message,
    };
  }

  /**
   * HttpException을 정규화된 에러 응답으로 변환
   *
   * @param {HttpException} exception HTTP 예외
   * @returns {{ statusCode: number; errorCode: string; message: string }} 정규화된 에러 응답
   */
  private resolveHttpException(exception: HttpException): { statusCode: number; errorCode: string; message: string } {
    const statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    const error: IErrorResponse =
      typeof exceptionResponse === 'string' ? { message: exceptionResponse } : (exceptionResponse as IErrorResponse);

    const errorCodeByStatus: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: GLOBAL_ERRORS.INVALID_REQUEST.errorCode,
      [HttpStatus.NOT_FOUND]: GLOBAL_ERRORS.ROUTE_NOT_FOUND.errorCode,
      [HttpStatus.TOO_MANY_REQUESTS]: GLOBAL_ERRORS.TOO_MANY_REQUESTS.errorCode,
    };

    const errorCode = error.errorCode ?? errorCodeByStatus[statusCode] ?? 'UNDEFINED_ERROR_CODE';

    const messageByStatus: Record<number, string> = {
      [HttpStatus.TOO_MANY_REQUESTS]: GLOBAL_ERRORS.TOO_MANY_REQUESTS.message,
    };

    const message = messageByStatus[statusCode] ?? error.message ?? 'UNDEFINED_ERROR_MESSAGE';

    return { statusCode, errorCode, message };
  }

  /**
   * Prisma의 known request error 여부 판별 (duck typing — runtime import 의존성 회피)
   *
   * @param {unknown} exception 검사할 예외
   * @returns {boolean} Prisma 에러 여부
   */
  private isPrismaKnownError(exception: unknown): exception is { code: string; message?: string } {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      typeof (exception as { code: unknown }).code === 'string' &&
      (exception as { code: string }).code.startsWith('P')
    );
  }

  /**
   * Prisma 에러 코드를 SPEC 응답 형식으로 매핑. 4xx로 분류 가능한 코드는 분리하고, 나머지는 500.
   *
   * @param {{ code: string; message?: string }} exception Prisma known error
   * @returns {{ statusCode: number; errorCode: string; message: string }} 정규화된 에러 응답
   */
  private resolvePrismaError(exception: { code: string; message?: string }): {
    statusCode: number;
    errorCode: string;
    message: string;
  } {
    if (exception.code === 'P2002') {
      this.logger.warn(`Prisma P2002 (unique violation): ${exception.message ?? ''}`);
      return GLOBAL_ERRORS.RESOURCE_CONFLICT;
    }

    if (exception.code === 'P2025') {
      this.logger.warn(`Prisma P2025 (record not found): ${exception.message ?? ''}`);
      return GLOBAL_ERRORS.RESOURCE_NOT_FOUND;
    }

    this.logger.error(`Prisma error code=${exception.code}: ${exception.message ?? ''}`);
    return GLOBAL_ERRORS.DATABASE_ERROR;
  }
}
