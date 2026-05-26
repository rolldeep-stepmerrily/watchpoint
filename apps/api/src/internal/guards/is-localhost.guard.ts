import { AppException } from '@@exceptions';
import { CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

import { INTERNAL_ERRORS } from '../internal.error';

const LOCALHOST_ADDRESSES = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

/**
 * /internal/* 엔드포인트 보호용.
 *
 * - `INTERNAL_API_KEY` env가 설정돼 있으면 `x-internal-key` 헤더 매칭 모드 (Railway 등 reverse proxy 뒤 운영 환경).
 * - 미설정이면 loopback IP만 통과 (로컬 개발 편의).
 *
 * prod에서 env 누락 + reverse proxy면 loopback이 아니라 항상 차단 — 명시적으로 INTERNAL_API_KEY를 설정해야 운영 접근 가능.
 */
@Injectable()
export class IsLocalhostGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const expectedKey = this.configService.get<string>('INTERNAL_API_KEY');

    if (expectedKey && expectedKey.length > 0) {
      const provided = request.headers['x-internal-key'];
      if (typeof provided !== 'string' || provided !== expectedKey) {
        throw new AppException(INTERNAL_ERRORS.FORBIDDEN);
      }
      return true;
    }

    const remoteAddress = request.socket.remoteAddress ?? '';
    if (!LOCALHOST_ADDRESSES.has(remoteAddress)) {
      throw new AppException(INTERNAL_ERRORS.FORBIDDEN);
    }
    return true;
  }
}
