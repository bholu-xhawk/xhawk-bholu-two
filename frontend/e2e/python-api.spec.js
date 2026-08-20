import { expect, test } from '@playwright/test'

const appApiURL = process.env.E2E_APP_API_URL || 'http://127.0.0.1:8010'
const healthApiURL = process.env.E2E_HEALTH_API_URL || 'http://127.0.0.1:8011'

test('FastAPI app root returns the hello response', async ({ request }) => {
  const response = await request.get(`${appApiURL}/`)

  expect(response.status()).toBe(200)
  await expect(response.json()).resolves.toEqual({ message: 'Hello, World!' })
})

test('FastAPI API health endpoint returns ok', async ({ request }) => {
  const response = await request.get(`${healthApiURL}/health`)

  expect(response.status()).toBe(200)
  await expect(response.json()).resolves.toEqual({ status: 'ok' })
})
