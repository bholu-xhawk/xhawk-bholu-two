const CUSTOMERS_URL = '/api/customers'

function isValidPositiveInteger(value) {
  return Number.isSafeInteger(value) && value > 0
}

function isValidNonNegativeInteger(value) {
  return Number.isSafeInteger(value) && value >= 0
}

function isValidCustomerEnvelope(payload) {
  return Boolean(
    payload &&
    Array.isArray(payload.items) &&
    isValidPositiveInteger(payload.page) &&
    isValidPositiveInteger(payload.pageSize) &&
    isValidNonNegativeInteger(payload.total) &&
    isValidNonNegativeInteger(payload.totalPages)
  )
}

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

  if (!isValidCustomerEnvelope(payload)) {
    throw new Error('Invalid customers response')
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
