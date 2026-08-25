describe('directoryClient', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, XHAWK_BHOLU_API_BASE_URL: 'https://producer.example.com/' };
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    delete global.fetch;
  });

  it('builds the producer URL with pagination query params and returns the payload unchanged', async () => {
    const payload = {
      data: [{ id: 'user-1', name: 'Ada', emailDomain: 'example.com' }],
      pagination: { page: 2, pageSize: 5, totalCount: 11, totalPages: 3 },
    };
    global.fetch.mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue(payload) });

    const { fetchUserDirectory } = require('../src/clients/directoryClient');
    const result = await fetchUserDirectory({ page: 2, pageSize: 5 });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const calledUrl = global.fetch.mock.calls[0][0];
    expect(calledUrl.toString()).toBe('https://producer.example.com/api/users/directory?page=2&pageSize=5');
    expect(result).toEqual(payload);
  });

  it('uses default pagination values', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({ data: [], pagination: {} }) });

    const { fetchUserDirectory } = require('../src/clients/directoryClient');
    await fetchUserDirectory();

    const calledUrl = global.fetch.mock.calls[0][0];
    expect(calledUrl.searchParams.get('page')).toBe('1');
    expect(calledUrl.searchParams.get('pageSize')).toBe('20');
  });

  it('throws a useful error when the upstream response is not ok', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 400, text: jest.fn().mockResolvedValue('{"error":"invalid pagination"}') });

    const { fetchUserDirectory } = require('../src/clients/directoryClient');

    await expect(fetchUserDirectory({ page: 0, pageSize: 10 })).rejects.toThrow(
      'Directory API request failed with status 400: {"error":"invalid pagination"}'
    );
  });
});
