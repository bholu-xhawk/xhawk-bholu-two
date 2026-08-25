const { XHAWK_BHOLU_API_BASE_URL } = require('../config');

function buildDirectoryUrl({ page = 1, pageSize = 20 } = {}) {
  const baseUrl = XHAWK_BHOLU_API_BASE_URL.replace(/\/+$/, '');
  const url = new URL('/api/users/directory', `${baseUrl}/`);
  url.searchParams.set('page', page);
  url.searchParams.set('pageSize', pageSize);
  return url;
}

async function fetchUserDirectory({ page = 1, pageSize = 20 } = {}) {
  const url = buildDirectoryUrl({ page, pageSize });
  const response = await fetch(url);

  if (!response.ok) {
    let details = '';
    try {
      details = await response.text();
    } catch (_err) {
      details = '';
    }

    const suffix = details ? `: ${details}` : '';
    throw new Error(`Directory API request failed with status ${response.status}${suffix}`);
  }

  return response.json();
}

module.exports = { fetchUserDirectory, buildDirectoryUrl };
