import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3001';

export default defineConfig({
  testDir: './specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    viewport: { width: 1280, height: 800 },
    locale: 'ko-KR',
    // Anthropic remote sandbox intercepts TLS with its own CA; Chromium rejects it
    ignoreHTTPSErrors: true,
    // Route Chromium browser contexts through the sandbox egress proxy when present.
    // Node.js (APIRequestContext) reads HTTPS_PROXY automatically; Chromium does not.
    // Note: Chromium 141+ sends ECH GREASE (TLS ext 0xFE0D) unconditionally; the
    // sandbox egress proxy resets the TLS handshake on this extension. Browser-based
    // tests therefore fail in the Anthropic remote sandbox — API-only tests still pass.
    ...(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {}),
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? undefined,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            // Belt-and-suspenders: set the proxy at the Chrome level too so that
            // internal services (safe-browsing, crash reporting) are also routed
            // through the egress proxy rather than triggering a direct-connect RST.
            ...(process.env.HTTPS_PROXY ? [`--proxy-server=${process.env.HTTPS_PROXY}`] : []),
          ],
        },
      },
    },
  ],
});
