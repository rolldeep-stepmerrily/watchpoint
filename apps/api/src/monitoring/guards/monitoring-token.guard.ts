import { AppException } from '@@exceptions';
import { timingSafeEqual } from 'node:crypto';
import { CanActivate, type ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

import { MONITORING_ERRORS } from '../monitoring.error';

/**
 * /internal/monitoring-log 전용 가드.
 *
 * - `MONITORING_INGEST_KEY` env가 필수. `x-monitoring-key` 헤더와 `timingSafeEqual`로 비교.
 * - env가 없으면 모든 요청을 차단 (운영자가 키 누락을 빠르게 인지하도록 부팅 시 warn).
 *
 * INTERNAL_API_KEY (master)와 분리한 이유는 권한 최소화 — leak 시 피해 범위가
 * monitoring-log ingest 1개 endpoint로 한정되도록.
 */
@Injectable()
export class MonitoringTokenGuard implements CanActivate {
  private readonly logger = new Logger(MonitoringTokenGuard.name);
  private warnedKeyMissing = false;

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const expectedKey = this.configService.get<string>('MONITORING_INGEST_KEY');

    if (!expectedKey || expectedKey.length === 0) {
      if (!this.warnedKeyMissing) {
        this.logger.warn('MONITORING_INGEST_KEY not set — all /internal/monitoring-log requests will be rejected.');
        this.warnedKeyMissing = true;
      }
      throw new AppException(MONITORING_ERRORS.FORBIDDEN);
    }

    const provided = request.headers['x-monitoring-key'];
    if (typeof provided !== 'string' || !this.safeEqual(provided, expectedKey)) {
      throw new AppException(MONITORING_ERRORS.FORBIDDEN);
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
