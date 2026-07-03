import { test as base, type APIRequestContext, type Page } from '@playwright/test';

/**
 * In Anthropic's remote sandbox, Chromium's BoringSSL fails TLS handshakes through
 * the TLS-intercepting proxy (net::ERR_CONNECTION_RESET). Node.js (undici) works fine.
 * This fixture intercepts all browser page requests and forwards them via Playwright's
 * APIRequestContext (Node.js/undici), which correctly reads HTTPS_PROXY.
 */
export const test = base.extend<{ page: Page }>({
  page: async ({ page, context }, use) => {
    if (process.env.HTTPS_PROXY) {
      await context.route('**/*', async (route) => {
        try {
          const response = await context.request.fetch(route.request());
          await route.fulfill({ response });
        } catch {
          try { await route.abort(); } catch { /* route may already be handled */ }
        }
      });
    }
    await use(page);
  },
});

export { expect } from '@playwright/test';
export type { APIRequestContext, Page };
