const TODOS_URL = '/api/todos'

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

export async function listTodos() {
  const response = await fetch(TODOS_URL)
  return parseResponse(response)
}
