const request = require('supertest');
const { getUserDirectory } = require('../src/clients/directoryClient');
const app = require('../src/app');

jest.mock('../src/clients/directoryClient', () => ({
  getUserDirectory: jest.fn(),
}));

describe('Directory proxy', () => {
  const directoryResponse = {
    users: [
      { id: 2, name: 'Bob', emailDomain: 'example.org' },
      { id: 3, name: 'Carol', emailDomain: 'example.net' },
    ],
    pagination: {
      page: 2,
      page_size: 2,
      total: 5,
      total_pages: 3,
      has_next: true,
      has_prev: true,
    },
  };

  beforeEach(() => {
    getUserDirectory.mockReset();
  });

  it('returns the shared directory response from the upstream client', async () => {
    getUserDirectory.mockResolvedValue(directoryResponse);

    const res = await request(app).get('/directory/users?page=2&page_size=2').expect(200);

    expect(getUserDirectory).toHaveBeenCalledWith({ page: 2, page_size: 2 });
    expect(res.body).toEqual(directoryResponse);
  });

  it('uses default pagination values when query parameters are omitted', async () => {
    getUserDirectory.mockResolvedValue({
      users: [],
      pagination: { page: 1, page_size: 10, total: 0, total_pages: 0, has_next: false, has_prev: false },
    });

    await request(app).get('/directory/users').expect(200);

    expect(getUserDirectory).toHaveBeenCalledWith({ page: 1, page_size: 10 });
  });

  it.each(['/directory/users?page=0', '/directory/users?page=1.5', '/directory/users?page=abc', '/directory/users?page_size=0'])(
    'rejects invalid pagination for %s',
    async (path) => {
      const res = await request(app).get(path).expect(400);

      expect(res.body).toEqual({ error: 'Invalid pagination parameters' });
      expect(getUserDirectory).not.toHaveBeenCalled();
    }
  );

  it('returns a stable bad gateway response when the upstream client fails', async () => {
    getUserDirectory.mockRejectedValue(new Error('network failed'));

    const res = await request(app).get('/directory/users?page=1&page_size=10').expect(502);

    expect(res.body).toEqual({ error: 'Unable to fetch user directory' });
  });
});
