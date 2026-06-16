import { PrismaService } from '@@db';
import { CallHandler, ExecutionContext, HttpException, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { Observable, tap } from 'rxjs';

/**
 * /career 및 /career/:playerId 호출의 audit log를 비동기로 적재한다.
 * 저장 필드: requestId, ip(raw), eventType(SEARCH|SUMMARY), query(q | playerId), success, errorCode.
 * 상세 수치는 저장하지 않음 (개인정보 노출 최소화).
 *
 * 응답 흐름을 막지 않기 위해 tap 안에서 fire-and-forget으로 적재하고, DB 실패는 warn으로만 남긴다.
 */
@Injectable()
export class CareerLookupLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CareerLookupLogInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const { eventType, query } = this.resolveEvent(req);
    const ip = this.resolveIp(req);
    const requestId = req.requestId ?? 'unknown';

    return next.handle().pipe(
      tap({
        next: () => {
          this.write({ requestId, eventType, query, ip, success: true, errorCode: null });
        },
        error: (err) => {
          this.write({ requestId, eventType, query, ip, success: false, errorCode: this.resolveErrorCode(err) });
        },
      }),
    );
  }

  /**
   * 컨트롤러 핸들러 종류로 SEARCH/SUMMARY/STATS를 구분.
   * - playerId 있고 URL에 `/stats`가 붙으면 STATS
   * - playerId만 있으면 SUMMARY
   * - 그 외엔 SEARCH(q 쿼리 저장)
   */
  private resolveEvent(req: Request): { eventType: 'SEARCH' | 'SUMMARY' | 'STATS'; query: string } {
    const playerId = typeof req.params?.playerId === 'string' ? req.params.playerId : null;

    if (playerId) {
      const path = typeof req.path === 'string' ? req.path : (req.url ?? '');
      const isStats = path.endsWith('/stats');

      return { eventType: isStats ? 'STATS' : 'SUMMARY', query: playerId };
    }

    const q = typeof req.query?.q === 'string' ? req.query.q : '';

    return { eventType: 'SEARCH', query: q };
  }

  /**
   * X-Forwarded-For 첫 IP(Railway proxy 뒤) 우선, fallback으로 socket.remoteAddress.
   * 마스킹/해싱은 하지 않고 raw 그대로 저장.
   */
  private resolveIp(req: Request): string {
    const forwarded = req.header('x-forwarded-for');

    if (typeof forwarded === 'string' && forwarded.length > 0) {
      const first = forwarded.split(',')[0]?.trim();

      if (first) {
        return first;
      }
    }

    return req.ip ?? req.socket.remoteAddress ?? 'unknown';
  }

  private resolveErrorCode(err: unknown): string {
    if (err instanceof HttpException) {
      const response = err.getResponse();

      if (typeof response === 'object' && response !== null && 'errorCode' in response) {
        const code = (response as { errorCode: unknown }).errorCode;

        if (typeof code === 'string') {
          return code;
        }
      }

      return `HTTP_${err.getStatus()}`;
    }

    return 'UNKNOWN';
  }

  private write(entry: {
    requestId: string;
    eventType: 'SEARCH' | 'SUMMARY' | 'STATS';
    query: string;
    ip: string;
    success: boolean;
    errorCode: string | null;
  }): void {
    this.prisma.careerLookupLog
      .create({ data: entry })
      .catch((err: unknown) => this.logger.warn(`Failed to persist career lookup log: ${String(err)}`));
  }
}
