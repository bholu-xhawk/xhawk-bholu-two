const request = require('supertest');

let app;

beforeEach(() => {
  jest.resetModules();
  app = require('../src/app');
});

async function createUser(user = {}) {
  return request(app)
    .post('/users')
    .send({ name: 'Alice', email: 'alice@example.com', ...user })
    .expect(201);
}

describe('Users CRUD', () => {
  it('POST /users creates a mock user', async () => {
    const res = await createUser();

    expect(res.body).toEqual({
      id: expect.any(String),
      name: 'Alice',
      email: 'alice@example.com',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    expect(res.body).not.toHaveProperty('_id');
  });

  it('POST /users rejects missing required fields', async () => {
    const res = await request(app)
      .post('/users')
      .send({ name: 'Missing Email' })
      .expect(400);

    expect(res.body).toEqual({ error: 'name and email are required' });
  });

  it('POST /users rejects duplicate emails', async () => {
    await createUser();

    const res = await request(app)
      .post('/users')
      .send({ name: 'Alice Again', email: 'alice@example.com' })
      .expect(409);

    expect(res.body).toEqual({ error: 'email already exists' });
  });

  it('GET /users lists mock users', async () => {
    await createUser({ name: 'Bob', email: 'bob@example.com' });

    const res = await request(app).get('/users').expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      id: expect.any(String),
      name: 'Bob',
      email: 'bob@example.com',
    });
  });

  it('GET /users/:id returns a mock user', async () => {
    const created = await createUser({ name: 'C', email: 'c@example.com' });
    const id = created.body.id;

    const res = await request(app).get(`/users/${id}`).expect(200);

    expect(res.body).toEqual(created.body);
  });

  it('GET /users/:id returns not found for unknown ids', async () => {
    const res = await request(app).get('/users/not-a-mongo-id').expect(404);

    expect(res.body).toEqual({ error: 'not found' });
  });

  it('PATCH /users/:id updates a mock user', async () => {
    const created = await createUser({ name: 'D', email: 'd@example.com' });
    const id = created.body.id;

    const res = await request(app)
      .patch(`/users/${id}`)
      .send({ name: 'Dan', email: 'dan@example.com' })
      .expect(200);

    expect(res.body).toMatchObject({
      id,
      name: 'Dan',
      email: 'dan@example.com',
      createdAt: created.body.createdAt,
      updatedAt: expect.any(String),
    });
  });

  it('PATCH /users/:id rejects duplicate emails', async () => {
    await createUser({ name: 'Existing', email: 'existing@example.com' });
    const created = await createUser({ name: 'D', email: 'd@example.com' });

    const res = await request(app)
      .patch(`/users/${created.body.id}`)
      .send({ email: 'existing@example.com' })
      .expect(409);

    expect(res.body).toEqual({ error: 'email already exists' });
  });

  it('PATCH /users/:id returns not found for unknown ids', async () => {
    const res = await request(app)
      .patch('/users/missing')
      .send({ name: 'Nobody' })
      .expect(404);

    expect(res.body).toEqual({ error: 'not found' });
  });

  it('DELETE /users/:id removes a mock user', async () => {
    const created = await createUser({ name: 'E', email: 'e@example.com' });
    const id = created.body.id;

    const deleted = await request(app).delete(`/users/${id}`).expect(204);
    expect(deleted.text).toBe('');

    await request(app).get(`/users/${id}`).expect(404);
  });

  it('DELETE /users/:id returns not found for unknown ids', async () => {
    const res = await request(app).delete('/users/missing').expect(404);

    expect(res.body).toEqual({ error: 'not found' });
  });
});
