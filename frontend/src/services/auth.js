export function getToken() {
  return localStorage.getItem('access_token')
}

export function setToken(token) {
  if (token) localStorage.setItem('access_token', token)
  else localStorage.removeItem('access_token')
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
