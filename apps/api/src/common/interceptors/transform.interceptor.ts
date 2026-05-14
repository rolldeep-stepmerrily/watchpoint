import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';

import { map, Observable } from 'rxjs';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  // biome-ignore lint/correctness/noUnusedFunctionParameters: NestInterceptor 시그니처 준수
  // biome-ignore lint/suspicious/noExplicitAny: 응답 타입은 핸들러마다 다름
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => data ?? {}));
  }
}
