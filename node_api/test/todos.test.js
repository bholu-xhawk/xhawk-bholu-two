const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let app;
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
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
  it('POST /todos creates a todo', async () => {
    const res = await request(app)
      .post('/todos')
      .send({ title: 'Buy milk', description: 'Pick up oat milk' })
      .expect(201);

    expect(res.body).toHaveProperty('_id');
    expect(res.body.title).toBe('Buy milk');
    expect(res.body.description).toBe('Pick up oat milk');
    expect(res.body.completed).toBe(false);
    expect(res.body).toHaveProperty('createdAt');
    expect(res.body).toHaveProperty('updatedAt');
  });

  it('GET /todos lists todos newest first', async () => {
    const older = await request(app).post('/todos').send({ title: 'Older todo' }).expect(201);
    const newer = await request(app).post('/todos').send({ title: 'Newer todo' }).expect(201);

    const res = await request(app).get('/todos').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.map((todo) => todo._id)).toEqual([newer.body._id, older.body._id]);
  });

  it('GET /todos/:id returns a todo', async () => {
    const created = await request(app).post('/todos').send({ title: 'Read docs' }).expect(201);

    const res = await request(app).get(`/todos/${created.body._id}`).expect(200);

    expect(res.body._id).toBe(created.body._id);
    expect(res.body.title).toBe('Read docs');
  });

  it('PATCH /todos/:id updates text fields and toggles completion', async () => {
    const created = await request(app).post('/todos').send({ title: 'Draft task' }).expect(201);

    const res = await request(app)
      .patch(`/todos/${created.body._id}`)
      .send({ title: 'Ship task', description: 'Done through the API', completed: true })
      .expect(200);

    expect(res.body.title).toBe('Ship task');
    expect(res.body.description).toBe('Done through the API');
    expect(res.body.completed).toBe(true);
  });

  it('DELETE /todos/:id removes a todo', async () => {
    const created = await request(app).post('/todos').send({ title: 'Remove me' }).expect(201);

    await request(app).delete(`/todos/${created.body._id}`).expect(204);
    await request(app).get(`/todos/${created.body._id}`).expect(404);
  });

  it('POST /todos rejects missing title', async () => {
    const res = await request(app).post('/todos').send({ description: 'No title' }).expect(400);

    expect(res.body.error).toBe('title is required');
  });

  it('PATCH /todos/:id rejects blank title', async () => {
    const created = await request(app).post('/todos').send({ title: 'Keep valid' }).expect(201);

    const res = await request(app).patch(`/todos/${created.body._id}`).send({ title: '   ' }).expect(400);

    expect(res.body.error).toBe('title is required');
  });

  it('returns 400 for invalid ids', async () => {
    await request(app).get('/todos/not-an-id').expect(400);
    await request(app).patch('/todos/not-an-id').send({ completed: true }).expect(400);
    await request(app).delete('/todos/not-an-id').expect(400);
  });

  it('returns 404 for unknown todos', async () => {
    const id = new mongoose.Types.ObjectId().toString();

    await request(app).get(`/todos/${id}`).expect(404);
    await request(app).patch(`/todos/${id}`).send({ completed: true }).expect(404);
    await request(app).delete(`/todos/${id}`).expect(404);
  });
});
