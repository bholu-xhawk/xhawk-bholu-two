let inMemoryToken = null

export function getToken() {
  return inMemoryToken
}

export function setToken(token) {
  inMemoryToken = token || null
}

export async function apiFetch(path, options = {}) {
  const token = getToken()
  const headers = new Headers(options.headers || {})
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const resp = await fetch(path, { ...options, headers })
  if (resp.status === 401) {
    // clear token on unauthorized
    setToken(null)
  }
  return resp
}
