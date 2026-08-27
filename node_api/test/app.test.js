const request = require('supertest');
const app = require('../src/app');

describe('Express app', () => {
  it('responds with 200 and Hello, World! message', async () => {
    const res = await request(app).get('/').expect(200);
    expect(res.body).toEqual({ message: 'Hello, World!' });
  });

  it('returns a JSON 404 for unknown API routes', async () => {
    const res = await request(app).get('/api/unknown').expect(404);
    expect(res.body).toEqual({ error: 'not found' });
  });
});
