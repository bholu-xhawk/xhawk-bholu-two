const { XHAWK_BHOLU_API_BASE_URL } = require('../config');

class UpstreamDirectoryError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'UpstreamDirectoryError';
    this.status = status;
  }
}

async function getUserDirectory({ page = 1, page_size = 10 } = {}) {
  const url = new URL('/api/users/directory', XHAWK_BHOLU_API_BASE_URL);
  url.searchParams.set('page', String(page));
  url.searchParams.set('page_size', String(page_size));

  const response = await fetch(url);
  if (!response.ok) {
    throw new UpstreamDirectoryError('Upstream directory request failed', response.status);
  }

  return response.json();
}

module.exports = { getUserDirectory, UpstreamDirectoryError };
