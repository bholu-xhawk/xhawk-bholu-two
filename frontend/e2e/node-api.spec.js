import { expect, test } from '@playwright/test'

const nodeApiURL = process.env.E2E_NODE_API_URL || 'http://127.0.0.1:3010'
const missingObjectId = '64b64c5e7f1a4c0012345678'

async function expectJson(response, expected) {
  await expect(response.json()).resolves.toEqual(expected)
}

async function expectError(response, status, message) {
  expect(response.status()).toBe(status)
  await expectJson(response, { error: message })
}

test('Express User API supports CRUD and validation errors', async ({ request }) => {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const email = `e2e-${unique}@example.com`
  const updatedEmail = `e2e-updated-${unique}@example.com`
  let createdId

  const root = await request.get(`${nodeApiURL}/`)
  expect(root.status()).toBe(200)
  await expectJson(root, { message: 'Hello, World!' })

  const missingFields = await request.post(`${nodeApiURL}/users`, {
    data: { name: 'Missing Email' },
  })
  await expectError(missingFields, 400, 'name and email are required')

  const created = await request.post(`${nodeApiURL}/users`, {
    data: { name: 'E2E User', email },
  })
  expect(created.status()).toBe(201)
  const createdBody = await created.json()
  createdId = createdBody._id
  expect(createdId).toBeTruthy()
  expect(createdBody.name).toBe('E2E User')
  expect(createdBody.email).toBe(email)

  try {
    const duplicate = await request.post(`${nodeApiURL}/users`, {
      data: { name: 'Duplicate User', email },
    })
    await expectError(duplicate, 409, 'email already exists')

    const list = await request.get(`${nodeApiURL}/users`)
    expect(list.status()).toBe(200)
    const users = await list.json()
    expect(Array.isArray(users)).toBe(true)
    expect(users.some((user) => user._id === createdId && user.email === email)).toBe(true)

    const fetched = await request.get(`${nodeApiURL}/users/${createdId}`)
    expect(fetched.status()).toBe(200)
    expect(await fetched.json()).toEqual(expect.objectContaining({ _id: createdId, name: 'E2E User', email }))

    const patched = await request.patch(`${nodeApiURL}/users/${createdId}`, {
      data: { name: 'Updated E2E User', email: updatedEmail },
    })
    expect(patched.status()).toBe(200)
    expect(await patched.json()).toEqual(expect.objectContaining({
      _id: createdId,
      name: 'Updated E2E User',
      email: updatedEmail,
    }))

    for (const method of ['get', 'patch', 'delete']) {
      const response = await request[method](`${nodeApiURL}/users/not-a-valid-id`, {
        data: method === 'patch' ? { name: 'Invalid' } : undefined,
      })
      await expectError(response, 400, 'invalid id')
    }

    const missing = await request.get(`${nodeApiURL}/users/${missingObjectId}`)
    await expectError(missing, 404, 'not found')

    const deleted = await request.delete(`${nodeApiURL}/users/${createdId}`)
    expect(deleted.status()).toBe(204)
    createdId = undefined

    const afterDelete = await request.get(`${nodeApiURL}/users/${createdBody._id}`)
    await expectError(afterDelete, 404, 'not found')
  } finally {
    if (createdId) {
      await request.delete(`${nodeApiURL}/users/${createdId}`)
    }
  }
})
