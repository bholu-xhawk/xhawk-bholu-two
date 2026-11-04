const CUSTOMERS_URL = '/api/customers'

async function parseResponse(response) {
  if (response.status === 204) return null

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

async function request(path = '', options = {}) {
  const { headers, ...requestOptions } = options
  const response = await fetch(`${CUSTOMERS_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...requestOptions,
  })

  return parseResponse(response)
}

export function getCustomer(id, options = {}) {
  return request(`/${encodeURIComponent(id)}`, options)
}

export function createCustomer(customer) {
  return request('', {
    method: 'POST',
    body: JSON.stringify(customer),
  })
}

export function updateCustomer(id, customer) {
  return request(`/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(customer),
  })
}
