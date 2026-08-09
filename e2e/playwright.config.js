const { defineConfig, devices } = require('@playwright/test');

const frontendUrl = process.env.E2E_FRONTEND_URL || 'http://127.0.0.1:5173';
const fastApiUrl = process.env.E2E_FASTAPI_URL || 'http://127.0.0.1:8000';
const nodeApiUrl = process.env.E2E_NODE_API_URL || 'http://127.0.0.1:3000';
const webServerEnv = { ...process.env };
if (process.env.E2E_KEEP_PYTHON_ENV !== '1') {
  delete webServerEnv.PYTHONPATH;
  delete webServerEnv.PYTHONHOME;
}

module.exports = defineConfig({
  testDir: './tests',
  globalSetup: require.resolve('./scripts/global-setup'),
  globalTeardown: require.resolve('./scripts/global-teardown'),
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: frontendUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  metadata: {
    frontendUrl,
    fastApiUrl,
    nodeApiUrl,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'python -m uvicorn app.main:app --host 127.0.0.1 --port 8000',
      url: `${fastApiUrl}/`,
      cwd: '..',
      env: webServerEnv,
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
    {
      command: 'npm start --prefix node_api',
      url: `${nodeApiUrl}/`,
      cwd: '..',
      env: {
        ...webServerEnv,
        PORT: '3000',
        MONGODB_URI: 'mongodb://127.0.0.1:27017/node_api_e2e',
      },
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
    {
      command: 'npm run dev --prefix frontend -- --host 127.0.0.1 --port 5173',
      url: `${frontendUrl}/`,
      cwd: '..',
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
  ],
});
