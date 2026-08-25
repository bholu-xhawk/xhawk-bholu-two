const request = require('supertest');
const app = require('../src/app');

describe('GET /', () => {
  it('responds with 200 and Hello, World! message', async () => {
    const res = await request(app).get('/').expect(200);
    expect(res.body).toEqual({ message: 'Hello, World!' });
  });

  it('allows configured local Vite origins through CORS', async () => {
    const res = await request(app).get('/').set('Origin', 'http://localhost:5173').expect(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});
