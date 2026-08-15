/**
 * Playwright custom fixtures for the Anthropic remote sandbox environment.
 *
 * Root cause: Chrome 124+ includes ML-KEM-768 (post-quantum) key shares in its TLS 1.3
 * ClientHello (~1263 bytes). The CCR egress proxy (127.0.0.1:36005) performs MITM TLS
 * but its parser crashes on these large key_share extensions and resets the connection
 * with ECONNRESET. All `page.goto()` calls fail as a result.
 *
 * Fix: when HTTPS_PROXY is set (sandbox environment), intercept every network request
 * via Playwright's route API and replay it through the APIRequestContext, which uses
 * Node.js/OpenSSL (no ML-KEM) and successfully tunnels through the CCR proxy.
 *
 * Domain filter: only watchpoint domains (o-watchpoint.com) are proxied. External CDN
 * requests (fonts, third-party scripts) are aborted cleanly — the sandbox proxy distorts
 * their MIME types, causing console errors, and buffering large asset files saturates the
 * Node.js request pool causing cascading timeouts in later tests.
 *
 * Content-encoding: the APIRequestContext auto-decompresses Brotli/gzip bodies but
 * preserves the Content-Encoding header; strip it so the browser doesn't attempt a second
 * decompression pass on the already-decoded body.
 *
 * Important: this only applies when HTTPS_PROXY is set. In local dev or CI without the
 * proxy the fixture is a no-op and tests run exactly as before.
 */

import { test as base, expect, request as requestModule } from '@playwright/test';
import type { APIRequestContext, BrowserContext } from '@playwright/test';

const sandboxProxy = process.env.HTTPS_PROXY;

export { expect };

export const test = base.extend<{ _routeInterceptor: undefined }, { sharedRequest: APIRequestContext }>({
  // Worker-scoped shared APIRequestContext — reused across all tests in a worker.
  sharedRequest: [
    // biome-ignore lint/correctness/noEmptyPattern: Playwright 1.60 requires object destructuring as first arg; named param triggers a separate lint error
    async ({}, use) => {
      if (!sandboxProxy) {
        // Outside the sandbox: no shared context needed; individual tests create their own.
        await use(null as unknown as APIRequestContext);
        return;
      }
      const ctx = await requestModule.newContext({ ignoreHTTPSErrors: true });
      await use(ctx);
      await ctx.dispose();
    },
    { scope: 'worker' },
  ],

  // Test-scoped fixture: attaches route interception to every browser context.
  _routeInterceptor: [
    async ({ context, sharedRequest }, use) => {
      if (sandboxProxy && sharedRequest) {
        await attachRouteInterceptor(context, sharedRequest);
      }
      await use(undefined);
    },
    { auto: true },
  ],
});

async function attachRouteInterceptor(context: BrowserContext, apiCtx: APIRequestContext) {
  await context.route('**', async (route) => {
    const url = route.request().url();

    // Only relay watchpoint domains through the Node.js request context.
    // External CDN requests are aborted cleanly to avoid MIME type distortion
    // and prevent connection pool exhaustion from large asset buffering.
    if (!url.includes('o-watchpoint.com')) {
      await route.abort().catch(() => undefined);
      return;
    }

    try {
      const resp = await apiCtx.fetch(route.request().url(), {
        method: route.request().method(),
        headers: route.request().headers(),
        data: route.request().postDataBuffer() ?? undefined,
        ignoreHTTPSErrors: true,
        maxRedirects: 0,
        failOnStatusCode: false,
      });
      const headers = resp.headers();
      // Strip encoding/length headers — body() returns already-decompressed bytes;
      // leaving Content-Encoding causes the browser to attempt a second decompression.
      delete headers['content-encoding'];
      delete headers['content-length'];
      await route.fulfill({ status: resp.status(), headers, body: await resp.body() });
    } catch {
      await route.abort().catch(() => undefined);
    }
  });
}
