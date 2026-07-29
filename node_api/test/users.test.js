const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let app;
let mongoServer;

beforeAll(async () => {
  // Spin up in-memory MongoDB
  mongoServer = await MongoMemoryServer.create({
    binary: { version: '7.0.3' },
  });
  const uri = mongoServer.getUri();

  // Set env var before requiring app/index to ensure connection uses this URI
  process.env.MONGODB_URI = uri;

  // Connect mongoose to the in-memory server
  await mongoose.connect(uri);

  // Require the express app (no HTTP server started)
  app = require('../src/app');
});

afterEach(async () => {
  // Clean all collections
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

describe('Users CRUD', () => {
  it('POST /users creates a user', async () => {
    const res = await request(app)
      .post('/users')
      .send({ name: 'Alice', email: 'alice@example.com' })
      .expect(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.name).toBe('Alice');
    expect(res.body.email).toBe('alice@example.com');
  });

  it('GET /users lists users', async () => {
    await request(app).post('/users').send({ name: 'Bob', email: 'bob@example.com' });
    const res = await request(app).get('/users').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].email).toBe('bob@example.com');
  });

  it('GET /users/:id returns a user', async () => {
    const created = await request(app).post('/users').send({ name: 'C', email: 'c@example.com' }).expect(201);
    const id = created.body._id;
    const res = await request(app).get(`/users/${id}`).expect(200);
    expect(res.body._id).toBe(id);
  });

  it('PATCH /users/:id updates a user', async () => {
    const created = await request(app).post('/users').send({ name: 'D', email: 'd@example.com' }).expect(201);
    const id = created.body._id;
    const res = await request(app).patch(`/users/${id}`).send({ name: 'Dan' }).expect(200);
    expect(res.body.name).toBe('Dan');
  });

  it('DELETE /users removes selected users only', async () => {
    const first = await request(app).post('/users').send({ name: 'E', email: 'e@example.com' }).expect(201);
    const second = await request(app).post('/users').send({ name: 'F', email: 'f@example.com' }).expect(201);
    const remaining = await request(app).post('/users').send({ name: 'G', email: 'g@example.com' }).expect(201);

    const res = await request(app)
      .delete('/users')
      .send({ ids: [first.body._id, second.body._id] })
      .expect(200);

    expect(res.body).toEqual({ deletedCount: 2 });
    await request(app).get(`/users/${first.body._id}`).expect(404);
    await request(app).get(`/users/${second.body._id}`).expect(404);

    const remainingRes = await request(app).get(`/users/${remaining.body._id}`).expect(200);
    expect(remainingRes.body.email).toBe('g@example.com');
  });

  it('DELETE /users rejects missing or empty ids', async () => {
    await request(app).delete('/users').send({}).expect(400);
    await request(app).delete('/users').send({ ids: [] }).expect(400);
  });

  it('DELETE /users rejects invalid ids', async () => {
    await request(app).delete('/users').send({ ids: ['not-a-valid-id'] }).expect(400);
  });

  it('DELETE /users/:id removes a user', async () => {
    const created = await request(app).post('/users').send({ name: 'H', email: 'h@example.com' }).expect(201);
    const id = created.body._id;
    await request(app).delete(`/users/${id}`).expect(204);

    await request(app).get(`/users/${id}`).expect(404);
  });
});
