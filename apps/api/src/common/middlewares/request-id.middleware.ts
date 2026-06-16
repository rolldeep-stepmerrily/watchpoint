import { randomUUID } from 'node:crypto';

import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

declare global {
  // biome-ignore lint/style/noNamespace: Express 타입 augmentation은 namespace 필수
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

/**
 * 들어온 X-Request-Id를 신뢰하거나 없으면 UUID v4 생성.
 * career audit log 등 요청 단위 식별이 필요한 곳에서 `req.requestId`로 접근.
 * 응답 헤더로도 echo back — 클라이언트가 장애 보고 시 참조 가능.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const headerId = req.header('x-request-id');
    const requestId =
      typeof headerId === 'string' && headerId.length > 0 && headerId.length <= 128 ? headerId : randomUUID();

    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);

    next();
  }
}
