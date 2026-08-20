const request = require('supertest');
const app = require('../src/app');

describe('App identity and health', () => {
  it('responds with the product API identity', async () => {
    const res = await request(app).get('/').expect(200);
    expect(res.body).toEqual({ name: 'Shared Expense API', status: 'ok' });
  });

  it('exposes a health endpoint', async () => {
    const res = await request(app).get('/health').expect(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
