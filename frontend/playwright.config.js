import { defineConfig, devices } from '@playwright/test'

const port = process.env.VITE_PORT || '5173'
const appURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`
const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  metadata: {
    fastApiRootURL: process.env.FASTAPI_ROOT_URL || 'http://127.0.0.1:8000',
    fastApiHealthURL: process.env.FASTAPI_HEALTH_URL || 'http://127.0.0.1:8001',
    nodeApiURL: process.env.NODE_API_URL || 'http://127.0.0.1:3000',
  },
  use: {
    baseURL: appURL,
    reducedMotion: 'reduce',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    ...(chromiumExecutable ? { launchOptions: { executablePath: chromiumExecutable } } : {}),
  },
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${port}`,
    url: appURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
