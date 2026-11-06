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

describe('Todos API', () => {
  it('creates, lists newest first, edits, toggles, and deletes todos', async () => {
    const first = await request(app)
      .post('/api/todos')
      .send({ title: '  First todo  ', dueDate: '2026-02-14' })
      .expect(201);

    expect(first.body).toMatchObject({ title: 'First todo', completed: false });
    expect(first.body.dueDate).toBe('2026-02-14T00:00:00.000Z');
    expect(first.body).toHaveProperty('_id');
    expect(first.body).toHaveProperty('createdAt');
    expect(first.body).toHaveProperty('updatedAt');

    const second = await request(app)
      .post('/api/todos')
      .send({ title: 'Second todo', completed: true })
      .expect(201);

    const list = await request(app).get('/api/todos').expect(200);
    expect(list.body.map((todo) => todo._id)).toEqual([second.body._id, first.body._id]);
    expect(list.body[1].dueDate).toBe('2026-02-14T00:00:00.000Z');

    const renamed = await request(app)
      .patch(`/api/todos/${first.body._id}`)
      .send({ title: ' Renamed todo ', dueDate: '2026-03-01' })
      .expect(200);
    expect(renamed.body.title).toBe('Renamed todo');
    expect(renamed.body.completed).toBe(false);
    expect(renamed.body.dueDate).toBe('2026-03-01T00:00:00.000Z');

    const completed = await request(app)
      .patch(`/api/todos/${first.body._id}`)
      .send({ completed: true })
      .expect(200);
    expect(completed.body.completed).toBe(true);

    const cleared = await request(app)
      .patch(`/api/todos/${first.body._id}`)
      .send({ dueDate: null })
      .expect(200);
    expect(cleared.body.dueDate).toBeNull();

    await request(app).delete(`/api/todos/${first.body._id}`).expect(204);

    const afterDelete = await request(app).get('/api/todos').expect(200);
    expect(afterDelete.body.map((todo) => todo._id)).toEqual([second.body._id]);
  });

  it('rejects blank and invalid titles', async () => {
    await request(app)
      .post('/api/todos')
      .send({ title: '   ' })
      .expect(400, { error: 'title is required' });

    const created = await request(app)
      .post('/api/todos')
      .send({ title: 'Valid todo' })
      .expect(201);

    await request(app)
      .patch(`/api/todos/${created.body._id}`)
      .send({ title: '' })
      .expect(400, { error: 'title is required' });

    await request(app)
      .patch(`/api/todos/${created.body._id}`)
      .send({ title: false })
      .expect(400, { error: 'title must be a string' });
  });

  it('rejects invalid completed values and empty patches', async () => {
    const created = await request(app)
      .post('/api/todos')
      .send({ title: 'Valid todo' })
      .expect(201);

    await request(app)
      .post('/api/todos')
      .send({ title: 'Invalid completed', completed: 'yes' })
      .expect(400, { error: 'completed must be a boolean' });

    await request(app)
      .patch(`/api/todos/${created.body._id}`)
      .send({ completed: 'yes' })
      .expect(400, { error: 'completed must be a boolean' });

    await request(app)
      .patch(`/api/todos/${created.body._id}`)
      .send({ ignored: 'field' })
      .expect(400, { error: 'at least one of title, completed, or dueDate is required' });
  });

  it('rejects invalid due dates', async () => {
    const created = await request(app)
      .post('/api/todos')
      .send({ title: 'Valid todo' })
      .expect(201);

    const invalidDueDateCases = [
      [{ title: 'Wrong type', dueDate: false }, 'dueDate must be a YYYY-MM-DD string or null'],
      [{ title: 'Malformed', dueDate: '2026/02/14' }, 'dueDate must be a valid YYYY-MM-DD date'],
      [{ title: 'Impossible', dueDate: '2026-02-30' }, 'dueDate must be a valid YYYY-MM-DD date'],
    ];

    for (const [body, message] of invalidDueDateCases) {
      await request(app).post('/api/todos').send(body).expect(400, { error: message });
    }

    await request(app)
      .patch(`/api/todos/${created.body._id}`)
      .send({ dueDate: 20260214 })
      .expect(400, { error: 'dueDate must be a YYYY-MM-DD string or null' });

    await request(app)
      .patch(`/api/todos/${created.body._id}`)
      .send({ dueDate: '2026-13-01' })
      .expect(400, { error: 'dueDate must be a valid YYYY-MM-DD date' });
  });

  it('returns consistent errors for invalid ids and missing records', async () => {
    const missingId = new mongoose.Types.ObjectId().toString();

    await request(app).patch('/api/todos/not-an-id').send({ completed: true }).expect(400, { error: 'invalid id' });
    await request(app).delete('/api/todos/not-an-id').expect(400, { error: 'invalid id' });

    await request(app).patch(`/api/todos/${missingId}`).send({ completed: true }).expect(404, { error: 'not found' });
    await request(app).delete(`/api/todos/${missingId}`).expect(404, { error: 'not found' });
  });
});
