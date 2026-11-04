import { afterEach, describe, expect, it, vi } from 'vitest'
import { createCustomer, getCustomer, updateCustomer } from './customers'

afterEach(() => {
  vi.unstubAllGlobals()
})

function mockJsonResponse(payload, options = {}) {
  return Promise.resolve({
    ok: options.ok ?? true,
    status: options.status ?? 200,
    json: () => Promise.resolve(payload),
  })
}

describe('customer API client', () => {
  it('reads one customer by id', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(await mockJsonResponse({ id: 'customer 1' }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(getCustomer('customer 1')).resolves.toEqual({ id: 'customer 1' })

    expect(fetchMock).toHaveBeenCalledWith('/api/customers/customer%201', {
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('creates a customer with the shared payload shape', async () => {
    const payload = { name: 'Ada', email: 'ada@example.com', company: 'Engines' }
    const fetchMock = vi.fn().mockResolvedValueOnce(await mockJsonResponse({ id: 'customer-1', ...payload }))
    vi.stubGlobal('fetch', fetchMock)

    await createCustomer(payload)

    expect(fetchMock).toHaveBeenCalledWith('/api/customers', {
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      body: JSON.stringify(payload),
    })
  })

  it('updates a customer with PATCH using the shared payload shape', async () => {
    const payload = { name: 'Grace', email: 'grace@example.com', company: 'Navy' }
    const fetchMock = vi.fn().mockResolvedValueOnce(await mockJsonResponse({ id: 'customer-2', ...payload }))
    vi.stubGlobal('fetch', fetchMock)

    await updateCustomer('customer-2', payload)

    expect(fetchMock).toHaveBeenCalledWith('/api/customers/customer-2', {
      headers: { 'Content-Type': 'application/json' },
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  })

  it('throws parsed API errors', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(await mockJsonResponse({ error: 'No customer' }, { ok: false, status: 404 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(getCustomer('missing')).rejects.toThrow('No customer')
  })
})
