import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const frontendDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(frontendDir, '..')

const FRONTEND_PORT = process.env.E2E_FRONTEND_PORT || '4173'
const APP_API_PORT = process.env.E2E_APP_API_PORT || '8010'
const HEALTH_API_PORT = process.env.E2E_HEALTH_API_PORT || '8011'
const NODE_API_PORT = process.env.E2E_NODE_API_PORT || '3010'

const frontendURL = `http://127.0.0.1:${FRONTEND_PORT}`
const appApiURL = `http://127.0.0.1:${APP_API_PORT}`
const healthApiURL = `http://127.0.0.1:${HEALTH_API_PORT}`
const nodeApiURL = `http://127.0.0.1:${NODE_API_PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  metadata: {
    frontendURL,
    appApiURL,
    healthApiURL,
    nodeApiURL,
  },
  use: {
    baseURL: frontendURL,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${FRONTEND_PORT}`,
      url: frontendURL,
      cwd: frontendDir,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: `python -m uvicorn app.main:app --host 127.0.0.1 --port ${APP_API_PORT}`,
      url: appApiURL,
      cwd: repoRoot,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: `python -m uvicorn api.app:app --host 127.0.0.1 --port ${HEALTH_API_PORT}`,
      url: `${healthApiURL}/health`,
      cwd: repoRoot,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'node frontend/e2e/support/node-api-memory-server.mjs',
      url: nodeApiURL,
      cwd: repoRoot,
      env: {
        PORT: NODE_API_PORT,
      },
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
})
