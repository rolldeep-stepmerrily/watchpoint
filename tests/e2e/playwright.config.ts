import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3001';

// Anthropic remote sandbox routes outbound HTTPS through a local MITM proxy.
// Chromium does not read HTTPS_PROXY automatically, so we pass it explicitly.
// The MITM proxy cannot re-terminate Chromium's modern TLS for watchpoint domains,
// so we bypass the proxy for those specific hosts (direct HTTPS is allowed by the firewall).
const HTTPS_PROXY = process.env.HTTPS_PROXY;
const PROXY_BYPASS = 'o-watchpoint.com,api.o-watchpoint.com,*.o-watchpoint.com';
const proxyArgs = HTTPS_PROXY
  ? [`--proxy-server=${HTTPS_PROXY}`, `--proxy-bypass-list=${PROXY_BYPASS}`]
  : [];

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
    ...(HTTPS_PROXY ? { proxy: { server: HTTPS_PROXY, bypass: PROXY_BYPASS } } : {}),
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? undefined,
          args: ['--no-sandbox', '--disable-setuid-sandbox', ...proxyArgs],
        },
      },
    },
  ],
});
