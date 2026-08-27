const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let app;
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({ binary: { version: '7.0.14' } });
  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;
  await mongoose.connect(uri);
  app = require('../src/app');
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

describe('Todos CRUD', () => {
  it('POST /api/todos creates a todo with a trimmed title', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({ title: '  Write tests  ' })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('_id', res.body.id);
    expect(res.body.title).toBe('Write tests');
    expect(res.body.completed).toBe(false);
    expect(res.body).toHaveProperty('createdAt');
    expect(res.body).toHaveProperty('updatedAt');
  });

  it('GET /api/todos lists todos in newest-first order', async () => {
    await request(app).post('/api/todos').send({ title: 'First todo' }).expect(201);
    await request(app).post('/api/todos').send({ title: 'Second todo' }).expect(201);

    const res = await request(app).get('/api/todos').expect(200);

    expect(res.body).toHaveLength(2);
    expect(res.body.map((todo) => todo.title)).toEqual(['Second todo', 'First todo']);
  });

  it('PATCH /api/todos/:id toggles completion', async () => {
    const created = await request(app)
      .post('/api/todos')
      .send({ title: 'Toggle me' })
      .expect(201);

    const res = await request(app)
      .patch(`/api/todos/${created.body.id}`)
      .send({ completed: true })
      .expect(200);

    expect(res.body.completed).toBe(true);
  });

  it('DELETE /api/todos/:id removes a todo', async () => {
    const created = await request(app)
      .post('/api/todos')
      .send({ title: 'Delete me' })
      .expect(201);

    await request(app).delete(`/api/todos/${created.body.id}`).expect(204);
    await request(app).delete(`/api/todos/${created.body.id}`).expect(404);
  });

  it('returns 422 for invalid create and patch bodies', async () => {
    await request(app).post('/api/todos').send({ title: '   ' }).expect(422);

    const created = await request(app)
      .post('/api/todos')
      .send({ title: 'Needs boolean' })
      .expect(201);

    await request(app)
      .patch(`/api/todos/${created.body.id}`)
      .send({ completed: 'yes' })
      .expect(422);
  });

  it('returns 400 for invalid ids and 404 for missing todos', async () => {
    await request(app).patch('/api/todos/not-an-id').send({ completed: true }).expect(400);
    await request(app).delete('/api/todos/not-an-id').expect(400);

    const missingId = new mongoose.Types.ObjectId().toString();
    await request(app).patch(`/api/todos/${missingId}`).send({ completed: true }).expect(404);
    await request(app).delete(`/api/todos/${missingId}`).expect(404);
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
  });
});
