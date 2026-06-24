import { defineConfig, devices } from '@playwright/test';
import { readdirSync } from 'fs';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3001';

// Anthropic remote sandbox routes outbound HTTPS through a local proxy (HTTPS_PROXY).
// When this env var is set, we apply sandbox-specific workarounds for Chromium.
const BROWSER_PROXY = process.env.HTTPS_PROXY ?? process.env.https_proxy;

// Detect the full Chromium binary in /opt/pw-browsers.
// In the Anthropic sandbox, chrome-headless-shell has its outbound network blocked,
// so we need the full Chromium binary.  The path includes the playwright revision
// (e.g., chromium-1223), so we discover it dynamically to survive playwright upgrades.
const sandboxChromiumPath = (() => {
  if (!BROWSER_PROXY) return undefined;
  try {
    const dirs = readdirSync('/opt/pw-browsers')
      .filter((d) => d.startsWith('chromium-') && !d.includes('headless') && !d.includes('tip'))
      .sort((a, b) => {
        const numA = parseInt(a.replace('chromium-', ''), 10);
        const numB = parseInt(b.replace('chromium-', ''), 10);
        return numB - numA;
      });
    return dirs.length ? `/opt/pw-browsers/${dirs[0]}/chrome-linux64/chrome` : undefined;
  } catch {
    return undefined;
  }
})();

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
    // When running inside the Anthropic remote sandbox:
    // 1. chrome-headless-shell has its network blocked; use full Chromium instead.
    // 2. Chromium auto-picks up HTTPS_PROXY, causing double TLS interception
    //    (HTTP proxy tunnel + transparent egress gateway) → ERR_CONNECTION_CLOSED.
    //    --no-proxy-server forces direct TCP so only the transparent gateway
    //    intercepts TLS once; --ignore-certificate-errors accepts its CA.
    ...(sandboxChromiumPath
      ? {
          launchOptions: {
            executablePath: sandboxChromiumPath,
            args: [
              '--headless=new',
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--no-proxy-server',
              '--ignore-certificate-errors',
            ],
          },
        }
      : {}),
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
