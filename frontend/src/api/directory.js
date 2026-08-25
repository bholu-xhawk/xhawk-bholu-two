export async function fetchDirectoryPage({ page = 1, page_size = 10 } = {}) {
  const baseUrl = (import.meta.env.VITE_NODE_API_BASE_URL || '').replace(/\/$/, '')
  const query = new URLSearchParams({
    page: String(page),
    page_size: String(page_size),
  })
  const response = await fetch(`${baseUrl}/directory/users?${query.toString()}`)

  if (!response.ok) {
    throw new Error('Unable to load team directory')
  }

  return response.json()
}
