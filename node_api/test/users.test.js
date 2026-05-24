const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let app;
let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // Override env before importing the app/index server bootstrap connects
  process.env.MONGODB_URI = uri;

  // Import after MONGODB_URI is set
  app = require('../src/app');

  // Manually connect mongoose since index.js is not used in tests
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
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

  it('GET /users returns list including created user', async () => {
    await request(app).post('/users').send({ name: 'Bob', email: 'bob@example.com' }).expect(201);
    const res = await request(app).get('/users').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].email).toBe('bob@example.com');
  });

  it('GET /users/:id returns the user', async () => {
    const create = await request(app).post('/users').send({ name: 'Carol', email: 'carol@example.com' }).expect(201);
    const id = create.body._id;
    const res = await request(app).get(`/users/${id}`).expect(200);
    expect(res.body._id).toBe(id);
  });

  it('PATCH /users/:id updates fields', async () => {
    const create = await request(app).post('/users').send({ name: 'Dave', email: 'dave@example.com' }).expect(201);
    const id = create.body._id;
    const res = await request(app)
      .patch(`/users/${id}`)
      .send({ name: 'David' })
      .expect(200);
    expect(res.body.name).toBe('David');
  });

  it('DELETE /users/:id removes the user', async () => {
    const create = await request(app).post('/users').send({ name: 'Eve', email: 'eve@example.com' }).expect(201);
    const id = create.body._id;
    await request(app).delete(`/users/${id}`).expect(204);
    await request(app).get(`/users/${id}`).expect(404);
  });
});
