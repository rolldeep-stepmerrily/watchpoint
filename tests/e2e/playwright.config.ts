import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3001';

// Anthropic remote sandbox routes outbound HTTPS through a local MITM proxy.
// Chromium's TLS fingerprint is blocked at the egress layer (ERR_CONNECTION_RESET),
// whereas Node.js-based request contexts work fine via HTTPS_PROXY.
// Short navigationTimeout makes browser tests fail fast instead of waiting 13 s each,
// keeping the full CI run well under 10 minutes.
const IS_AGENT_SANDBOX = process.env.HTTPS_PROXY?.startsWith('http://127.0.0.1');

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
    // Sandbox: intercepts TLS with its own CA; ignoreHTTPSErrors covers cert-level errors
    ignoreHTTPSErrors: true,
    // Sandbox: Chromium doesn't read HTTPS_PROXY automatically
    ...(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {}),
    // Sandbox: Chromium browser nav always resets — fail fast so CI doesn't time out
    ...(IS_AGENT_SANDBOX ? { navigationTimeout: 2_000 } : {}),
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? undefined,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
      },
    },
  ],
});
