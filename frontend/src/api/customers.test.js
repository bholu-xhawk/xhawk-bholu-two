import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createCustomer, getCustomer, updateCustomer } from './customers'

function jsonResponse(payload, options = {}) {
  return new Response(JSON.stringify(payload), {
    status: options.status || 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  globalThis.fetch = vi.fn()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('customers API client', () => {
  it('loads a customer by id from the detail endpoint', async () => {
    const customer = { _id: 'customer-1', name: 'Ada Lovelace', email: 'ada@example.com', company: 'Analytical Engines' }
    globalThis.fetch.mockResolvedValueOnce(jsonResponse(customer))

    await expect(getCustomer('customer-1')).resolves.toEqual(customer)

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/customers/customer-1', {
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('creates a customer with a trimmed JSON payload', async () => {
    const createdCustomer = { _id: 'customer-2', name: 'Grace Hopper', email: 'grace@example.com', company: 'Navy' }
    globalThis.fetch.mockResolvedValueOnce(jsonResponse(createdCustomer, { status: 201 }))

    await expect(
      createCustomer({ name: ' Grace Hopper ', email: ' grace@example.com ', company: ' Navy ' }),
    ).resolves.toEqual(createdCustomer)

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/customers', {
      method: 'POST',
      body: JSON.stringify({ name: 'Grace Hopper', email: 'grace@example.com', company: 'Navy' }),
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('updates a customer by id with a trimmed JSON payload', async () => {
    const updatedCustomer = { _id: 'customer-3', name: 'Katherine Johnson', email: 'kj@example.com', company: 'NASA' }
    globalThis.fetch.mockResolvedValueOnce(jsonResponse(updatedCustomer))

    await expect(
      updateCustomer('customer-3', { name: ' Katherine Johnson ', email: ' kj@example.com ', company: ' NASA ' }),
    ).resolves.toEqual(updatedCustomer)

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/customers/customer-3', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Katherine Johnson', email: 'kj@example.com', company: 'NASA' }),
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('surfaces API error messages', async () => {
    globalThis.fetch.mockResolvedValueOnce(jsonResponse({ error: 'Email already exists' }, { status: 409 }))

    await expect(createCustomer({ name: 'Ada', email: 'ada@example.com', company: 'Math' })).rejects.toThrow(
      'Email already exists',
    )
  })

  it('uses a default error when the API returns no error message', async () => {
    globalThis.fetch.mockResolvedValueOnce(new Response('', { status: 500 }))

    await expect(getCustomer('missing')).rejects.toThrow('Request failed')
  })
})
