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
    // Anthropic remote sandbox: TLS interception handled via --proxy-server in launchOptions
    ignoreHTTPSErrors: true,
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
            // Proxy + TLS workaround for Anthropic remote sandbox:
            // HTTPS_PROXY re-terminates TLS; Chromium's TrustAnchorIds extension causes the
            // proxy to reset the connection before completing the TLS handshake.
            ...(process.env.HTTPS_PROXY
              ? [`--proxy-server=${process.env.HTTPS_PROXY}`, '--disable-features=TLSTrustAnchorIds']
              : []),
          ],
        },
      },
    },
  ],
});
