const request = require('supertest');
const app = require('../src/app');

describe('GET /', () => {
  it('identifies the Patch TODO service', async () => {
    const res = await request(app).get('/').expect(200);
    expect(res.body).toEqual({
      name: 'Patch TODO API',
      storage: 'in-memory',
      todos: '/api/todos',
    });
  });
});

describe('JSON error handling', () => {
  it('normalizes malformed JSON parser errors', async () => {
    await request(app)
      .post('/api/todos')
      .set('Content-Type', 'application/json')
      .send('{"title":')
      .expect(400, { error: 'malformed JSON body' });
  });

  it('returns JSON for unmatched routes', async () => {
    await request(app).get('/users').expect(404, { error: 'route not found: GET /users' });
  });
});
