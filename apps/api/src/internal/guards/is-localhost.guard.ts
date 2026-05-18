import { AppException } from '@@exceptions';
import { CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';

import { INTERNAL_ERRORS } from '../internal.error';

const LOCALHOST_ADDRESSES = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

/**
 * /internal/* 엔드포인트 보호용. loopback IP만 통과.
 * 운영에선 reverse proxy 뒤가 아니라 노드에 직접 들어오는 트래픽만 허용한다는 의도.
 */
@Injectable()
export class IsLocalhostGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const remoteAddress = request.socket.remoteAddress ?? '';

    if (!LOCALHOST_ADDRESSES.has(remoteAddress)) {
      throw new AppException(INTERNAL_ERRORS.FORBIDDEN);
    }

    return true;
  }
}
