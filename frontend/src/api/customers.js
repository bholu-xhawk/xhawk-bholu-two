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
  const response = await fetch(`${CUSTOMERS_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  return parseResponse(response)
}

function customerPayload(customer) {
  return {
    name: customer.name.trim(),
    email: customer.email.trim(),
    company: customer.company.trim(),
  }
}

export function getCustomer(id) {
  return request(`/${id}`)
}

export function createCustomer(customer) {
  return request('', {
    method: 'POST',
    body: JSON.stringify(customerPayload(customer)),
  })
}

export function updateCustomer(id, customer) {
  return request(`/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(customerPayload(customer)),
  })
}
