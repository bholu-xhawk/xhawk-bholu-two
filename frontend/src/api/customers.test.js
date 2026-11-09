import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createCustomer, listCustomers, updateCustomer } from './customers'

function jsonResponse(payload, init = {}) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.stubGlobal('fetch', vi.fn())
})

describe('customer API client', () => {
  it('lists customers from the customers endpoint', async () => {
    const customers = [{ _id: 'customer-1', name: 'Ada', email: 'ada@example.com', company: 'Math Co' }]
    fetch.mockResolvedValueOnce(jsonResponse(customers))

    await expect(listCustomers()).resolves.toEqual(customers)

    expect(fetch).toHaveBeenCalledWith('/api/customers', {
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('creates customers with the JSON fields expected by the API', async () => {
    const customer = { name: 'Ada Lovelace', email: 'ada@example.com', company: 'Math Co' }
    fetch.mockResolvedValueOnce(jsonResponse({ _id: 'customer-1', ...customer }, { status: 201 }))

    await createCustomer(customer)

    expect(fetch).toHaveBeenCalledWith('/api/customers', {
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      body: JSON.stringify(customer),
    })
  })

  it('updates customers by id with PATCH and the JSON fields expected by the API', async () => {
    const customer = { name: 'Grace Hopper', email: 'grace@example.com', company: 'Navy' }
    fetch.mockResolvedValueOnce(jsonResponse({ _id: 'customer-2', ...customer }))

    await updateCustomer('customer-2', customer)

    expect(fetch).toHaveBeenCalledWith('/api/customers/customer-2', {
      headers: { 'Content-Type': 'application/json' },
      method: 'PATCH',
      body: JSON.stringify(customer),
    })
  })

  it('throws the normalized error from failed responses', async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ error: 'Email already exists' }, { status: 409 }))

    await expect(createCustomer({ name: 'Ada', email: 'ada@example.com', company: 'Math Co' })).rejects.toThrow(
      'Email already exists',
    )
  })
})
