import { AppException } from '@@exceptions';
import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { isDefined } from 'class-validator';
import type { Request } from 'express';

import { AUTH_ERRORS } from '../auth.error';

/**
 * JwtAuthGuard 뒤에 chain되어 user.role === ADMIN을 강제하는 가드.
 *
 * @example
 * ```ts
 * @UseGuards(JwtAuthGuard, AdminGuard)
 * @Get()
 * adminOnly() { ... }
 * ```
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: { role?: string } }>();
    const user = request.user;

    if (!isDefined(user) || user.role !== 'ADMIN') {
      throw new AppException(AUTH_ERRORS.FORBIDDEN);
    }

    return true;
  }
}
