const request = require('supertest');
const app = require('../src/app');
const todoStore = require('../src/store/todos');

const MISSING_ID = '00000000-0000-4000-8000-000000000000';

function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

beforeEach(() => {
  todoStore.resetTodosForTest();
});

describe('Todos API', () => {
  it('lists an initially empty store', async () => {
    await request(app).get('/api/todos').expect(200, []);
  });

  it('creates trimmed todos with default completion and timestamps', async () => {
    const created = await request(app)
      .post('/api/todos')
      .send({ title: '  First todo  ' })
      .expect(201);

    expect(created.body).toMatchObject({ title: 'First todo', completed: false });
    expect(created.body._id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(new Date(created.body.createdAt).toISOString()).toBe(created.body.createdAt);
    expect(created.body.updatedAt).toBe(created.body.createdAt);
  });

  it('accepts an explicit completed value at creation', async () => {
    const created = await request(app)
      .post('/api/todos')
      .send({ title: 'Already done', completed: true })
      .expect(201);

    expect(created.body.completed).toBe(true);
  });

  it('lists todos newest-created first and retrieves a todo by id', async () => {
    const first = await request(app).post('/api/todos').send({ title: 'First' }).expect(201);
    const second = await request(app).post('/api/todos').send({ title: 'Second' }).expect(201);

    const list = await request(app).get('/api/todos').expect(200);
    expect(list.body.map((todo) => todo._id)).toEqual([second.body._id, first.body._id]);

    const retrieved = await request(app).get(`/api/todos/${first.body._id}`).expect(200);
    expect(retrieved.body).toEqual(first.body);
  });

  it('patches title and completion while preserving createdAt', async () => {
    const created = await request(app)
      .post('/api/todos')
      .send({ title: 'Original' })
      .expect(201);

    await delay(5);

    const renamed = await request(app)
      .patch(`/api/todos/${created.body._id}`)
      .send({ title: '  Renamed  ' })
      .expect(200);

    expect(renamed.body).toMatchObject({
      _id: created.body._id,
      title: 'Renamed',
      completed: false,
      createdAt: created.body.createdAt,
    });
    expect(new Date(renamed.body.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(created.body.updatedAt).getTime()
    );

    const completed = await request(app)
      .patch(`/api/todos/${created.body._id}`)
      .send({ completed: true })
      .expect(200);

    expect(completed.body.title).toBe('Renamed');
    expect(completed.body.completed).toBe(true);
    expect(completed.body.createdAt).toBe(created.body.createdAt);
  });

  it('deletes a todo with a 204 response', async () => {
    const created = await request(app).post('/api/todos').send({ title: 'Delete me' }).expect(201);

    await request(app).delete(`/api/todos/${created.body._id}`).expect(204);
    await request(app).get(`/api/todos/${created.body._id}`).expect(404, { error: 'not found' });
    await request(app).get('/api/todos').expect(200, []);
  });

  it('returns 404 for missing records with well-formed ids', async () => {
    await request(app).get(`/api/todos/${MISSING_ID}`).expect(404, { error: 'not found' });
    await request(app)
      .patch(`/api/todos/${MISSING_ID}`)
      .send({ completed: true })
      .expect(404, { error: 'not found' });
    await request(app).delete(`/api/todos/${MISSING_ID}`).expect(404, { error: 'not found' });
  });

  it('rejects malformed ids', async () => {
    await request(app).get('/api/todos/not-an-id').expect(400, { error: 'invalid id' });
    await request(app)
      .patch('/api/todos/not-an-id')
      .send({ completed: true })
      .expect(400, { error: 'invalid id' });
    await request(app).delete('/api/todos/not-an-id').expect(400, { error: 'invalid id' });
  });

  it('rejects non-object and empty request bodies', async () => {
    const created = await request(app).post('/api/todos').send({ title: 'Valid' }).expect(201);

    await request(app)
      .post('/api/todos')
      .send(['array'])
      .expect(400, { error: 'request body must be a JSON object' });

    await request(app)
      .patch(`/api/todos/${created.body._id}`)
      .send([])
      .expect(400, { error: 'request body must be a JSON object' });

    await request(app)
      .patch(`/api/todos/${created.body._id}`)
      .send({})
      .expect(400, { error: 'at least one of title or completed is required' });
  });

  it('rejects blank, missing, and wrongly typed titles without changing state', async () => {
    const created = await request(app).post('/api/todos').send({ title: 'Kept' }).expect(201);

    await request(app).post('/api/todos').send({ title: '   ' }).expect(400, { error: 'title is required' });
    await request(app).post('/api/todos').send({ completed: false }).expect(400, { error: 'title is required' });
    await request(app)
      .patch(`/api/todos/${created.body._id}`)
      .send({ title: false })
      .expect(400, { error: 'title must be a string' });
    await request(app)
      .patch(`/api/todos/${created.body._id}`)
      .send({ title: '' })
      .expect(400, { error: 'title is required' });

    await request(app).get('/api/todos').expect(200, [created.body]);
  });

  it('rejects wrong completed types, unsupported fields, and preserves state', async () => {
    const created = await request(app).post('/api/todos').send({ title: 'Kept' }).expect(201);

    await request(app)
      .post('/api/todos')
      .send({ title: 'Invalid completed', completed: 'yes' })
      .expect(400, { error: 'completed must be a boolean' });
    await request(app)
      .patch(`/api/todos/${created.body._id}`)
      .send({ completed: 'yes' })
      .expect(400, { error: 'completed must be a boolean' });
    await request(app)
      .post('/api/todos')
      .send({ title: 'No extras', priority: 'high' })
      .expect(400, { error: 'unsupported field: priority' });
    await request(app)
      .patch(`/api/todos/${created.body._id}`)
      .send({ ignored: 'field' })
      .expect(400, { error: 'unsupported field: ignored' });

    await request(app).get('/api/todos').expect(200, [created.body]);
  });
});
