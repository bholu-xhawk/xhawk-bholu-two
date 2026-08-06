const request = require('supertest');
const app = require('../src/app');

describe('GET /', () => {
  it('responds with 200 and Hello, World! message', async () => {
    const res = await request(app).get('/').expect(200);
    expect(res.body).toEqual({ message: 'Hello, World!' });
  });
});

describe('GET /student', () => {
  it('responds with static student data', async () => {
    const res = await request(app).get('/student').expect(200);

    expect(res.body).toEqual({
      id: '123',
      name: 'John Doe',
      age: 20,
      grade: 'A',
    });
  });
});
