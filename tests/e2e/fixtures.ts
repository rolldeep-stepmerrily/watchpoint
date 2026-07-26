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
    async (_fixtures, use) => {
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
      await use();
    },
    { auto: true },
  ],
});

async function attachRouteInterceptor(context: BrowserContext, apiCtx: APIRequestContext) {
  await context.route('**', async (route) => {
    const req = route.request();
    try {
      const resp = await apiCtx.fetch(req.url(), {
        method: req.method(),
        headers: req.headers(),
        data: req.postDataBuffer() ?? undefined,
        ignoreHTTPSErrors: true,
        // Do not follow redirects; let the browser handle them to preserve navigation semantics.
        maxRedirects: 0,
        failOnStatusCode: false,
      });
      await route.fulfill({ response: resp });
    } catch {
      // Best-effort: if the relay fetch fails (e.g., POST to an analytics endpoint that
      // fires after the test completes), abort gracefully rather than hanging.
      await route.abort().catch(() => undefined);
    }
  });
}
