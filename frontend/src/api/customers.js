const CUSTOMERS_URL = '/api/customers'

async function parseResponse(response) {
  let payload = null
  try {
    payload = await response.json()
  } catch (_error) {
    payload = null
  }

  if (!response.ok) {
    const message = payload?.error || 'Request failed'
    throw new Error(message)
  }

  return payload
}

export async function listCustomers({ search = '', sort = 'signedUpAt', direction = 'desc', page = 1, signal } = {}) {
  const params = new URLSearchParams()
  params.set('search', search)
  params.set('sort', sort)
  params.set('direction', direction)
  params.set('page', String(page))

  const response = await fetch(`${CUSTOMERS_URL}?${params.toString()}`, { signal })
  return parseResponse(response)
}
