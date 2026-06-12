import { AppException } from '@@exceptions';
import { timingSafeEqual } from 'node:crypto';
import { CanActivate, type ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

import { INTERNAL_ERRORS } from '../internal.error';

const LOCALHOST_ADDRESSES = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

/**
 * /internal/* 엔드포인트 보호용.
 *
 * - `INTERNAL_API_KEY` env가 설정돼 있으면 `x-internal-key` 헤더 매칭 모드 (Railway 등 reverse proxy 뒤 운영 환경).
 *   비교는 `timingSafeEqual`로 일정 시간 — 단순 `===`는 byte-by-byte 단락 평가로 timing oracle 위험.
 * - 미설정이면 loopback IP만 통과 (로컬 개발 편의). prod에서 env 누락 + reverse proxy면 loopback이 아닌
 *   proxy IP가 떨어져 모든 요청이 차단된다. 부팅 시 1회 warn으로 운영자에게 누락 사실을 알린다.
 */
@Injectable()
export class IsLocalhostGuard implements CanActivate {
  private readonly logger = new Logger(IsLocalhostGuard.name);
  private warnedKeyMissing = false;

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const expectedKey = this.configService.get<string>('INTERNAL_API_KEY');

    if (expectedKey && expectedKey.length > 0) {
      const provided = request.headers['x-internal-key'];
      if (typeof provided !== 'string' || !this.safeEqual(provided, expectedKey)) {
        throw new AppException(INTERNAL_ERRORS.FORBIDDEN);
      }
      return true;
    }

    if (!this.warnedKeyMissing && process.env.NODE_ENV === 'production') {
      this.logger.warn('INTERNAL_API_KEY not set in production — /internal/* falls back to loopback-only.');
      this.warnedKeyMissing = true;
    }

    const remoteAddress = request.socket.remoteAddress ?? '';
    if (!LOCALHOST_ADDRESSES.has(remoteAddress)) {
      throw new AppException(INTERNAL_ERRORS.FORBIDDEN);
    }
    return true;
  }

  private safeEqual(provided: string, expected: string): boolean {
    if (provided.length !== expected.length) {
      return false;
    }
    return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  }
}
