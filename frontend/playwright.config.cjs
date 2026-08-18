const { defineConfig, devices } = require('@playwright/test');

const apiPort = process.env.E2E_API_PORT || 3100;
const uiPort = process.env.E2E_UI_PORT || 5173;
const apiBaseUrl = `http://127.0.0.1:${apiPort}`;
const uiBaseUrl = `http://127.0.0.1:${uiPort}`;

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: uiBaseUrl,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: `node e2e/start-book-api.cjs`,
      url: `${apiBaseUrl}/`,
      env: {
        ...process.env,
        PORT: String(apiPort),
      },
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${uiPort}`,
      url: uiBaseUrl,
      env: {
        ...process.env,
        VITE_API_BASE_URL: apiBaseUrl,
      },
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});
