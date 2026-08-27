const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let app;
let mongoServer;
let Todo;
let User;
let createAuthToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({ binary: { version: '7.0.14' } });
  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;
  await mongoose.connect(uri);
  app = require('../src/app');
  Todo = require('../src/models/Todo');
  User = require('../src/models/User');
  ({ createAuthToken } = require('../src/auth'));
});

afterEach(async () => {
  jest.restoreAllMocks();
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

async function createUser(overrides = {}) {
  const suffix = new mongoose.Types.ObjectId().toString();
  const user = await User.create({
    name: overrides.name || `User ${suffix}`,
    email: overrides.email || `${suffix}@example.com`,
  });
  return { user, token: createAuthToken(user._id) };
}

function auth(requestBuilder, token) {
  return requestBuilder.set('Authorization', `Bearer ${token}`);
}

describe('Todos CRUD', () => {
  it('requires authentication for todo routes', async () => {
    await request(app).get('/api/todos').expect(401);
    await request(app).post('/api/todos').send({ title: 'No auth' }).expect(401);
  });

  it('POST /api/todos creates a todo with a trimmed title for the authenticated user', async () => {
    const { user, token } = await createUser();

    const res = await auth(
      request(app).post('/api/todos').send({ title: '  Write tests  ' }),
      token
    ).expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('_id', res.body.id);
    expect(res.body.title).toBe('Write tests');
    expect(res.body.completed).toBe(false);
    expect(res.body.userId).toBe(user._id.toString());
    expect(res.body).toHaveProperty('createdAt');
    expect(res.body).toHaveProperty('updatedAt');
  });

  it('GET /api/todos lists only the authenticated user todos in newest-first order', async () => {
    const owner = await createUser();
    const other = await createUser();

    await auth(request(app).post('/api/todos').send({ title: 'First todo' }), owner.token).expect(201);
    await auth(request(app).post('/api/todos').send({ title: 'Other todo' }), other.token).expect(201);
    await auth(request(app).post('/api/todos').send({ title: 'Second todo' }), owner.token).expect(201);

    const res = await auth(request(app).get('/api/todos'), owner.token).expect(200);

    expect(res.body).toHaveLength(2);
    expect(res.body.map((todo) => todo.title)).toEqual(['Second todo', 'First todo']);
    expect(res.body.every((todo) => todo.userId === owner.user._id.toString())).toBe(true);
  });

  it('returns a controlled 500 response when list query fails', async () => {
    const { token } = await createUser();
    jest.spyOn(Todo, 'find').mockReturnValue({
      sort: () => ({
        lean: () => Promise.reject(new Error('database offline')),
      }),
    });

    const res = await auth(request(app).get('/api/todos'), token).expect(500);

    expect(res.body).toEqual({ error: 'internal error' });
  });

  it('PATCH /api/todos/:id toggles completion only for the owner', async () => {
    const owner = await createUser();
    const other = await createUser();
    const created = await auth(
      request(app).post('/api/todos').send({ title: 'Toggle me' }),
      owner.token
    ).expect(201);

    await auth(
      request(app).patch(`/api/todos/${created.body.id}`).send({ completed: true }),
      other.token
    ).expect(404);

    const res = await auth(
      request(app).patch(`/api/todos/${created.body.id}`).send({ completed: true }),
      owner.token
    ).expect(200);

    expect(res.body.completed).toBe(true);
  });

  it('DELETE /api/todos/:id removes a todo only for the owner', async () => {
    const owner = await createUser();
    const other = await createUser();
    const created = await auth(
      request(app).post('/api/todos').send({ title: 'Delete me' }),
      owner.token
    ).expect(201);

    await auth(request(app).delete(`/api/todos/${created.body.id}`), other.token).expect(404);
    await auth(request(app).delete(`/api/todos/${created.body.id}`), owner.token).expect(204);
    await auth(request(app).delete(`/api/todos/${created.body.id}`), owner.token).expect(404);
  });

  it('returns 422 for invalid create and patch bodies', async () => {
    const { token } = await createUser();
    await auth(request(app).post('/api/todos').send({ title: '   ' }), token).expect(422);

    const created = await auth(
      request(app).post('/api/todos').send({ title: 'Needs boolean' }),
      token
    ).expect(201);

    await auth(
      request(app).patch(`/api/todos/${created.body.id}`).send({ completed: 'yes' }),
      token
    ).expect(422);
  });

  it('returns 400 for invalid ids and 404 for missing todos', async () => {
    const { token } = await createUser();
    await auth(request(app).patch('/api/todos/not-an-id').send({ completed: true }), token).expect(400);
    await auth(request(app).delete('/api/todos/not-an-id'), token).expect(400);

    const missingId = new mongoose.Types.ObjectId().toString();
    await auth(request(app).patch(`/api/todos/${missingId}`).send({ completed: true }), token).expect(404);
    await auth(request(app).delete(`/api/todos/${missingId}`), token).expect(404);
  });

  it('responds to browser CORS preflight requests', async () => {
    const res = await request(app)
      .options('/api/todos')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST')
      .expect(204);

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-methods']).toContain('PATCH');
    expect(res.headers['access-control-allow-headers']).toContain('Content-Type');
    expect(res.headers['access-control-allow-headers']).toContain('Authorization');
  });
});
