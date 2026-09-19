import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4284',
    channel: process.env['E2E_CHROME_CHANNEL'] || 'chrome',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
});
