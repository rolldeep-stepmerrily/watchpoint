import { execSync } from 'child_process';
import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3001';

// Anthropic remote sandbox: chrome-headless-shell has SSL handshake failures (net_error -101).
// The full chrome binary works fine. Prefer PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH env var,
// then fall back to finding chrome (not headless shell) under PLAYWRIGHT_BROWSERS_PATH.
function resolveChromiumExecutable(): string | undefined {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
    return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  }
  const browsersPath = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!browsersPath) return undefined;
  try {
    const found = execSync(
      `find "${browsersPath}" -name 'chrome' ! -name 'chrome-headless-shell' -type f 2>/dev/null | head -1`,
    )
      .toString()
      .trim();
    return found || undefined;
  } catch {
    return undefined;
  }
}

// In the Anthropic sandbox, HTTPS_PROXY is set but chrome-headless-shell cannot tunnel
// through it (ERR_CONNECTION_RESET). Direct TCP is allowed, so bypass the proxy.
const HTTPS_PROXY = process.env.HTTPS_PROXY || '';
const sandboxArgs = HTTPS_PROXY ? ['--no-proxy-server'] : [];

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
          executablePath: resolveChromiumExecutable(),
          args: ['--no-sandbox', '--disable-setuid-sandbox', ...sandboxArgs],
        },
      },
    },
  ],
});
