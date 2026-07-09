import { test as base } from '@playwright/test';

export * from '@playwright/test';

/**
 * Extends the default `page` fixture with a HTTPS route interceptor.
 *
 * Chromium cannot perform TLS handshake through the Anthropic remote-sandbox
 * MITM proxy (the proxy re-terminates TLS, but Chromium resets the connection
 * despite `ignoreHTTPSErrors: true`).  The workaround is to intercept every
 * HTTPS request at the Playwright network layer and fulfil it via Node.js
 * `fetch`, which does respect HTTPS_PROXY and works correctly in the sandbox.
 *
 * Outside the sandbox (HTTPS_PROXY not set) this fixture is a no-op, so local
 * development and CI environments that have direct network access are
 * unaffected.
 */
export const test = base.extend<{ page: base['page'] }>({
  page: async ({ page }, use) => {
    if (process.env.HTTPS_PROXY) {
      // NOTE: Playwright glob 'https://**' does not match https: URLs in this env;
      //       a regex is required.
      await page.route(/https:\/\//, async (route, req) => {
        try {
          const method = req.method();
          const body = ['GET', 'HEAD'].includes(method) ? undefined : req.postDataBuffer() ?? undefined;
          const headers: Record<string, string> = {};
          for (const [k, v] of Object.entries(req.headers())) {
            // Drop hop-by-hop headers that fetch() manages itself
            if (k === 'host' || k === 'connection' || k === 'transfer-encoding') continue;
            headers[k] = v;
          }

          const res = await fetch(req.url(), { method, headers, body, redirect: 'manual' });
          const resHeaders: Record<string, string> = {};
          res.headers.forEach((v, k) => {
            resHeaders[k] = v;
          });

          await route.fulfill({
            status: res.status,
            headers: resHeaders,
            body: Buffer.from(await res.arrayBuffer()),
          });
        } catch {
          await route.abort('failed');
        }
      });
    }
    await use(page);
  },
});
