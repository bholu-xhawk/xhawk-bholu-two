const TODOS_URL = '/api/todos'

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
  const response = await fetch(`${TODOS_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  return parseResponse(response)
}

export function listTodos() {
  return request()
}

export function createTodo(title) {
  return request('', {
    method: 'POST',
    body: JSON.stringify({ title }),
  })
}

export function updateTodo(id, fields) {
  return request(`/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(fields),
  })
}

export function deleteTodo(id) {
  return request(`/${id}`, { method: 'DELETE' })
}
