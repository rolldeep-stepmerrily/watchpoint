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
    // Anthropic remote sandbox: Chromium ignores HTTPS_PROXY env var — must be set
    // explicitly so the browser can reach external sites through the egress proxy.
    // ignoreHTTPSErrors covers proxy CA cert when the proxy does MITM for some hosts.
    ignoreHTTPSErrors: true,
    proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          // Use pre-installed full Chrome binary (not headless-shell) so TLS behaviour
          // matches a real browser. Falls back to env var if set for non-sandbox CI.
          executablePath:
            process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/opt/pw-browsers/chromium',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            // Force TLS 1.2 max: the headless Chromium TLS 1.3 JA3 fingerprint is
            // blocked by Cloudflare bot protection on Vercel-hosted prod edges.
            // TLS 1.2 uses a different fingerprint that passes through cleanly.
            '--ssl-version-max=tls1.2',
          ],
        },
      },
    },
  ],
});
