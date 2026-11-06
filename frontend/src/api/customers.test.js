import { afterEach, describe, expect, it, vi } from 'vitest'
import { listCustomers } from './customers'

afterEach(() => {
  vi.restoreAllMocks()
})

function mockCustomersResponse(body, overrides = {}) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(body),
    ...overrides,
  })
}

describe('listCustomers', () => {
  it('returns a valid customer envelope', async () => {
    const envelope = { items: [], page: 1, pageSize: 20, total: 0, totalPages: 0 }
    mockCustomersResponse(envelope)

    await expect(listCustomers()).resolves.toBe(envelope)
  })

  it('rejects successful responses with malformed JSON', async () => {
    mockCustomersResponse(null, { json: () => Promise.reject(new SyntaxError('Unexpected token <')) })

    await expect(listCustomers()).rejects.toThrow('Invalid customers response')
  })

  it('rejects successful responses without the customer envelope', async () => {
    mockCustomersResponse({ items: null, page: 1, pageSize: 20, total: 0, totalPages: 0 })

    await expect(listCustomers()).rejects.toThrow('Invalid customers response')
  })

  it('rejects successful responses with invalid pagination fields', async () => {
    mockCustomersResponse({ items: [], page: 0, pageSize: 20, total: 0, totalPages: 0 })

    await expect(listCustomers()).rejects.toThrow('Invalid customers response')
  })
})
