const request = require('supertest');

jest.mock('../src/clients/directoryClient', () => ({
  fetchUserDirectory: jest.fn(),
}));

const { fetchUserDirectory } = require('../src/clients/directoryClient');
const app = require('../src/app');

describe('Directory proxy route', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns the upstream directory payload unchanged and forwards pagination', async () => {
    const payload = {
      data: [{ id: 'user-2', name: 'Grace', emailDomain: 'example.org' }],
      pagination: { page: 3, pageSize: 10, totalCount: 21, totalPages: 3 },
    };
    fetchUserDirectory.mockResolvedValue(payload);

    const res = await request(app).get('/directory/users?page=3&pageSize=10').expect(200);

    expect(fetchUserDirectory).toHaveBeenCalledWith({ page: '3', pageSize: '10' });
    expect(res.body).toEqual(payload);
  });

  it('responds with a bad gateway when the producer request fails', async () => {
    fetchUserDirectory.mockRejectedValue(new Error('Directory API request failed with status 500'));

    const res = await request(app).get('/directory/users').expect(502);

    expect(res.body).toEqual({ error: 'Directory API request failed with status 500' });
  });
});
