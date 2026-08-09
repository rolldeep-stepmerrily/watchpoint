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
            '--disable-quic',
            // Sandbox egress proxy (HTTPS_PROXY) causes ERR_CONNECTION_RESET for Chromium
            // browser connections. Direct TCP/TLS to HTTPS sites works fine from the sandbox.
            // The Node.js request fixture reads HTTPS_PROXY from env automatically — no change.
            ...(process.env.HTTPS_PROXY ? ['--proxy-server=direct://'] : []),
          ],
        },
      },
    },
  ],
});
