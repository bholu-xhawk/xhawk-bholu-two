const DEFAULT_API_BASE_URL = 'http://localhost:3000'

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '')

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  if (response.status === 204) return null

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error((data && data.error) || `Request failed with status ${response.status}`)
  }

  return data
}

export function fetchBooks() {
  return requestJson('/books')
}

export function fetchBook(id) {
  return requestJson(`/books/${id}`)
}

export function createBook(book) {
  return requestJson('/books', {
    method: 'POST',
    body: JSON.stringify(book),
  })
}

export function updateBook(id, book) {
  return requestJson(`/books/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(book),
  })
}

export function deleteBook(id) {
  return requestJson(`/books/${id}`, { method: 'DELETE' })
}

export function bulkDeleteBooks(ids) {
  return requestJson('/books/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
}
