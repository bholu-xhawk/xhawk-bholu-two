const request = require('supertest');
const app = require('../src/app');

describe('GET /', () => {
  it('responds with 200 and Hello, World! message', async () => {
    const res = await request(app).get('/').expect(200);
    expect(res.body).toEqual({ message: 'Hello, World!' });
  });
});

describe('POST /student', () => {
  it('responds with 201 and returns the submitted student data', async () => {
    const student = {
      name: 'John Doe',
      age: 20,
      class: 'Physics',
      rollNumber: '12345',
    };

    const res = await request(app).post('/student').send(student).expect(201);

    expect(res.body).toEqual({
      message: 'Student created successfully',
      student,
    });
  });
});
