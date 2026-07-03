const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let app;
let mongoServer;

beforeAll(async () => {
  // Spin up in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
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

  it('PUT /users/:id replaces a user successfully', async () => {
    const created = await request(app)
      .post('/users')
      .send({ name: 'P1', email: 'p1@example.com' })
      .expect(201);
    const id = created.body._id;

    const putRes = await request(app)
      .put(`/users/${id}`)
      .send({ name: 'Paul', email: 'paul@example.com' })
      .expect(200);
    expect(putRes.body.name).toBe('Paul');
    expect(putRes.body.email).toBe('paul@example.com');

    const getRes = await request(app).get(`/users/${id}`).expect(200);
    expect(getRes.body.name).toBe('Paul');
    expect(getRes.body.email).toBe('paul@example.com');
  });

  it('PUT /users/:id missing email returns 400', async () => {
    const created = await request(app)
      .post('/users')
      .send({ name: 'P2', email: 'p2@example.com' })
      .expect(201);
    const id = created.body._id;
    await request(app)
      .put(`/users/${id}`)
      .send({ name: 'New Name' })
      .expect(400);
  });

  it('PUT /users/:id missing name returns 400', async () => {
    const created = await request(app)
      .post('/users')
      .send({ name: 'P3', email: 'p3@example.com' })
      .expect(201);
    const id = created.body._id;
    await request(app)
      .put(`/users/${id}`)
      .send({ email: 'new@example.com' })
      .expect(400);
  });

  it('PUT /users/:id with invalid id returns 400', async () => {
    await request(app)
      .put('/users/invalid-id')
      .send({ name: 'X', email: 'x@example.com' })
      .expect(400);
  });

  it('PUT /users/:id with non-existent id returns 404', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    await request(app)
      .put(`/users/${nonExistentId}`)
      .send({ name: 'Ghost', email: 'ghost@example.com' })
      .expect(404);
  });

  it('PUT /users/:id with duplicate email returns 409', async () => {
    const u1 = await request(app)
      .post('/users')
      .send({ name: 'U1', email: 'u1@example.com' })
      .expect(201);
    const u2 = await request(app)
      .post('/users')
      .send({ name: 'U2', email: 'u2@example.com' })
      .expect(201);

    await request(app)
      .put(`/users/${u1.body._id}`)
      .send({ name: 'U1 New', email: 'u2@example.com' })
      .expect(409);
  });

  it('DELETE /users/:id removes a user', async () => {
    const created = await request(app).post('/users').send({ name: 'E', email: 'e@example.com' }).expect(201);
    const id = created.body._id;
    await request(app).delete(`/users/${id}`).expect(204);

    await request(app).get(`/users/${id}`).expect(404);
  });
});

