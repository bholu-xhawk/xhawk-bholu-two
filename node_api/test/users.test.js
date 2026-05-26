const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let app;
let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
  // require after setting env so connectDB uses in index.js when server starts under tests that import app directly
  app = require('../src/app');
  // Ensure DB is connected as tests hit routes that use Mongoose operations
  const { connectDB } = require('../src/config/db');
  await connectDB(uri);
});

afterAll(async () => {
  await mongoose.connection.close();
  if (mongod) await mongod.stop();
});

describe('User CRUD', () => {
  let created;

  it('POST /users creates a user', async () => {
    const res = await request(app)
      .post('/users')
      .send({ name: 'Alice', email: 'alice@example.com' })
      .expect(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.name).toBe('Alice');
    expect(res.body.email).toBe('alice@example.com');
    created = res.body;
  });

  it('GET /users returns list including created', async () => {
    const res = await request(app).get('/users').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.find(u => u._id === created._id)).toBeTruthy();
  });

  it('GET /users/:id returns the specific user', async () => {
    const res = await request(app).get(`/users/${created._id}`).expect(200);
    expect(res.body._id).toBe(created._id);
  });

  it('PUT /users/:id updates fields', async () => {
    const res = await request(app)
      .put(`/users/${created._id}`)
      .send({ name: 'Alice Smith', email: 'alice.smith@example.com' })
      .expect(200);
    expect(res.body.name).toBe('Alice Smith');
    expect(res.body.email).toBe('alice.smith@example.com');
  });

  it('DELETE /users/:id removes the user', async () => {
    await request(app).delete(`/users/${created._id}`).expect(204);
    await request(app).get(`/users/${created._id}`).expect(404);
  });
});
