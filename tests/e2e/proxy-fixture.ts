import { test as base } from '@playwright/test';

/**
 * Anthropic remote sandbox에서 Chromium이 TLS 1.3 ECH 익스텐션으로 인해
 * HTTPS_PROXY를 통한 HTTPS 연결을 수립하지 못하는 문제 우회.
 * page 픽스처를 확장해, HTTPS_PROXY 환경변수가 설정된 경우 모든 브라우저
 * 요청을 Playwright request 컨텍스트(Node.js HTTPS, 프록시 호환)로 라우팅한다.
 */
export const test = base.extend<{ page: ReturnType<typeof base>['page'] extends Promise<infer T> ? T : never }>({
  page: async ({ page, request }, use) => {
    if (process.env.HTTPS_PROXY) {
      await page.route('**/*', async (route) => {
        const req = route.request();
        try {
          const resp = await request.fetch(req.url(), {
            method: req.method(),
            headers: req.headers(),
            data: req.postDataBuffer() ?? undefined,
          });
          const body = await resp.body();
          const headers: Record<string, string> = {};
          for (const [k, v] of Object.entries(resp.headers())) {
            // content-encoding / transfer-encoding은 이미 디코드된 body와 충돌하므로 제거
            if (!['content-encoding', 'transfer-encoding'].includes(k)) {
              headers[k] = v;
            }
          }
          await route.fulfill({ status: resp.status(), headers, body });
        } catch {
          await route.abort('failed');
        }
      });
    }
    await use(page);
  },
});

export { expect } from '@playwright/test';
