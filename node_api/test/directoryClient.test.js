describe('directoryClient', () => {
  const directoryResponse = {
    users: [{ id: 1, name: 'Alice', emailDomain: 'example.com' }],
    pagination: {
      page: 2,
      page_size: 1,
      total: 3,
      total_pages: 3,
      has_next: true,
      has_prev: true,
    },
  };

  beforeEach(() => {
    jest.resetModules();
    process.env.XHAWK_BHOLU_API_BASE_URL = 'http://upstream.test';
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete process.env.XHAWK_BHOLU_API_BASE_URL;
    delete global.fetch;
  });

  it('constructs the upstream URL with requested pagination', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => directoryResponse });
    const { getUserDirectory } = require('../src/clients/directoryClient');

    await getUserDirectory({ page: 2, page_size: 25 });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      new URL('http://upstream.test/api/users/directory?page=2&page_size=25')
    );
  });

  it('uses default pagination values', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => directoryResponse });
    const { getUserDirectory } = require('../src/clients/directoryClient');

    await getUserDirectory();

    expect(global.fetch).toHaveBeenCalledWith(
      new URL('http://upstream.test/api/users/directory?page=1&page_size=10')
    );
  });

  it('passes through the upstream directory response unchanged', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => directoryResponse });
    const { getUserDirectory } = require('../src/clients/directoryClient');

    await expect(getUserDirectory({ page: 2, page_size: 1 })).resolves.toBe(directoryResponse);
  });

  it('throws a stable error for non-success upstream responses', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({ error: 'boom' }) });
    const { getUserDirectory, UpstreamDirectoryError } = require('../src/clients/directoryClient');

    const request = getUserDirectory({ page: 1, page_size: 10 });

    await expect(request).rejects.toBeInstanceOf(UpstreamDirectoryError);
    await expect(request).rejects.toMatchObject({
      message: 'Upstream directory request failed',
      status: 500,
    });
  });
});
