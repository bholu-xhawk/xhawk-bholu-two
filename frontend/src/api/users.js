const API_BASE_URL = (import.meta.env.VITE_NODE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json') ? await response.json() : null

  if (!response.ok) {
    const message = payload?.error || payload?.message || `Request failed with status ${response.status}`
    throw new Error(message)
  }

  return payload
}

export async function getUsers() {
  const response = await fetch(`${API_BASE_URL}/users`)
  return parseResponse(response)
}

export async function deleteUsers(ids) {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  })

  return parseResponse(response)
}
