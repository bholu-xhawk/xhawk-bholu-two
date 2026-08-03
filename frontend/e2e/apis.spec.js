import { expect, request as playwrightRequest, test } from '@playwright/test'

const DEFAULT_FASTAPI_ROOT_URL = 'http://127.0.0.1:8000'
const DEFAULT_FASTAPI_HEALTH_URL = 'http://127.0.0.1:8001'
const DEFAULT_NODE_API_URL = 'http://127.0.0.1:3000'

function serviceURL(name, fallback) {
  return (process.env[name] || fallback).replace(/\/$/, '')
}

async function availableContext(baseURL, probePath) {
  const context = await playwrightRequest.newContext({ baseURL })

  try {
    const response = await context.get(probePath, {
      failOnStatusCode: false,
      timeout: 3_000,
    })

    if (!response.ok()) {
      await context.dispose()
      return {
        context: null,
        reason: `${baseURL}${probePath} returned HTTP ${response.status()}`,
      }
    }

    return { context, reason: null }
  } catch (error) {
    await context.dispose()
    return {
      context: null,
      reason: `${baseURL}${probePath} is unreachable: ${error.message}`,
    }
  }
}

test.describe('optional backend APIs', () => {
  test('FastAPI root service returns its hello world payload when reachable', async () => {
    const baseURL = serviceURL('FASTAPI_ROOT_URL', DEFAULT_FASTAPI_ROOT_URL)
    const { context, reason } = await availableContext(baseURL, '/')
    test.skip(!context, `Skipping FASTAPI_ROOT_URL check because ${reason}`)

    try {
      const response = await context.get('/')
      await expect(response).toBeOK()
      await expect(response).toHaveJSON({ message: 'Hello, World!' })
    } finally {
      await context.dispose()
    }
  })

  test('FastAPI health service returns ok when reachable', async () => {
    const baseURL = serviceURL('FASTAPI_HEALTH_URL', DEFAULT_FASTAPI_HEALTH_URL)
    const { context, reason } = await availableContext(baseURL, '/health')
    test.skip(!context, `Skipping FASTAPI_HEALTH_URL check because ${reason}`)

    try {
      const response = await context.get('/health')
      await expect(response).toBeOK()
      await expect(response).toHaveJSON({ status: 'ok' })
    } finally {
      await context.dispose()
    }
  })

  test('Node users API supports a full user lifecycle when reachable', async ({}, testInfo) => {
    const baseURL = serviceURL('NODE_API_URL', DEFAULT_NODE_API_URL)
    const { context, reason } = await availableContext(baseURL, '/')
    test.skip(!context, `Skipping NODE_API_URL check because ${reason}`)

    const unique = `${Date.now()}-${testInfo.workerIndex}-${testInfo.retry}`
    const initialEmail = `playwright-${unique}@example.com`
    const updatedEmail = `playwright-updated-${unique}@example.com`
    let userId

    try {
      const createResponse = await context.post('/users', {
        data: {
          name: 'Playwright User',
          email: initialEmail,
        },
      })
      expect(createResponse.status()).toBe(201)
      const created = await createResponse.json()
      expect(created).toEqual(expect.objectContaining({
        name: 'Playwright User',
        email: initialEmail,
      }))
      expect(created._id).toBeTruthy()
      userId = created._id

      const listResponse = await context.get('/users')
      await expect(listResponse).toBeOK()
      const users = await listResponse.json()
      expect(users).toEqual(expect.arrayContaining([
        expect.objectContaining({ _id: userId, email: initialEmail }),
      ]))

      const fetchResponse = await context.get(`/users/${userId}`)
      await expect(fetchResponse).toBeOK()
      await expect(fetchResponse).toHaveJSON(expect.objectContaining({
        _id: userId,
        name: 'Playwright User',
        email: initialEmail,
      }))

      const updateResponse = await context.patch(`/users/${userId}`, {
        data: {
          name: 'Updated Playwright User',
          email: updatedEmail,
        },
      })
      await expect(updateResponse).toBeOK()
      await expect(updateResponse).toHaveJSON(expect.objectContaining({
        _id: userId,
        name: 'Updated Playwright User',
        email: updatedEmail,
      }))

      const deleteResponse = await context.delete(`/users/${userId}`)
      expect(deleteResponse.status()).toBe(204)

      const missingResponse = await context.get(`/users/${userId}`)
      expect(missingResponse.status()).toBe(404)
      userId = null
    } finally {
      if (userId) {
        await context.delete(`/users/${userId}`)
      }
      await context.dispose()
    }
  })
})
