export async function fetchUserDirectory({ page = 1, pageSize = 20 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })

  const response = await fetch(`/directory/users?${params.toString()}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch user directory: ${response.status}`)
  }

  return response.json()
}
