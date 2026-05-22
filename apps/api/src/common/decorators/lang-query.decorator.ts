import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@watchpoint/shared';

/**
 * `?lang=ko|en|ja` 쿼리 파라미터를 Locale로 파싱. 누락/허용되지 않은 값이면 DEFAULT_LOCALE 반환.
 *
 * @example
 *   async getOne(@LangQuery() lang: Locale) { ... }
 */
export const LangQuery = createParamDecorator((_data: unknown, ctx: ExecutionContext): Locale => {
  const request = ctx.switchToHttp().getRequest<{ query: Record<string, unknown> }>();
  const raw = request.query?.lang;
  return isLocale(raw) ? raw : DEFAULT_LOCALE;
});
