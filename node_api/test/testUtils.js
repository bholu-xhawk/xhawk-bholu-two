const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let app;
let mongoServer;

async function setupDatabase() {
  process.env.JWT_SECRET = 'test-secret';
  process.env.MONGOMS_VERSION = process.env.MONGOMS_VERSION || '7.0.14';
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;
  await mongoose.connect(uri);
  app = require('../src/app');
  return app;
}

async function cleanupDatabase() {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

async function teardownDatabase() {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
}

async function registerUser(overrides = {}) {
  const stamp = Math.random().toString(36).slice(2);
  const payload = {
    name: overrides.name || `User ${stamp}`,
    email: overrides.email || `user-${stamp}@example.com`,
    password: overrides.password || 'password123',
    defaultCurrency: overrides.defaultCurrency || 'USD',
  };
  const res = await request(app).post('/auth/register').send(payload).expect(201);
  return { ...res.body, password: payload.password };
}

async function createGroup(token, payload = {}) {
  const res = await request(app)
    .post('/groups')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: payload.name || 'Trip', baseCurrency: payload.baseCurrency || 'USD' })
    .expect(201);
  return res.body;
}

async function addMember(token, groupId, email) {
  const res = await request(app)
    .post(`/groups/${groupId}/members`)
    .set('Authorization', `Bearer ${token}`)
    .send({ email })
    .expect(201);
  return res.body;
}

module.exports = { request, setupDatabase, cleanupDatabase, teardownDatabase, registerUser, createGroup, addMember };
