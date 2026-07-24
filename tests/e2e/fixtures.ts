import { test as base, expect } from '@playwright/test';

export { expect };

/**
 * Anthropic remote sandbox blocks Chromium's direct HTTPS connections (JA3 fingerprint
 * filtering by Vercel). When HTTPS_PROXY is set, we intercept all browser HTTPS requests
 * and forward them through Playwright's Node.js APIRequestContext, which honours HTTPS_PROXY
 * and successfully reaches the prod site.
 *
 * Has no effect in local dev (HTTPS_PROXY is not set) — tests run normally there.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const test = base.extend<{}>({
  context: async ({ context, playwright }, use) => {
    if (process.env.HTTPS_PROXY) {
      const apiCtx = await playwright.request.newContext({ ignoreHTTPSErrors: true });

      await context.route(/^https:\/\//, async (route) => {
        const req = route.request();
        const postData = req.postDataBuffer();
        try {
          const resp = await apiCtx.fetch(req.url(), {
            method: req.method(),
            headers: req.headers(),
            ...(postData ? { data: postData } : {}),
          });
          await route.fulfill({ response: resp });
        } catch {
          // Abort if fetch failed; ignore if route is already handled or context closed
          try { await route.abort(); } catch { /* already handled or context closed */ }
        }
      });

      await use(context);
      await apiCtx.dispose();
    } else {
      await use(context);
    }
  },
});
