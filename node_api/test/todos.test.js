const request = require('supertest');
const app = require('../src/app');
const todosRouter = require('../src/routes/todos');

beforeEach(() => {
  todosRouter.resetTodos();
});

describe('Todos mock CRUD', () => {
  it('POST /todos creates a todo with predictable fields', async () => {
    const res = await request(app)
      .post('/todos')
      .send({ title: 'Write tests', description: 'Pin the mock contract', completed: true })
      .expect(201);

    expect(res.body).toEqual({
      id: '1',
      title: 'Write tests',
      description: 'Pin the mock contract',
      completed: true,
      created_at: expect.any(String),
    });
    expect(new Date(res.body.created_at).toISOString()).toBe(res.body.created_at);
  });

  it('POST /todos uses defaults for optional fields', async () => {
    const res = await request(app)
      .post('/todos')
      .send({ title: 'Use defaults' })
      .expect(201);

    expect(res.body.description).toBe('');
    expect(res.body.completed).toBe(false);
  });

  it('GET /todos lists todos', async () => {
    await request(app).post('/todos').send({ title: 'First' }).expect(201);
    await request(app).post('/todos').send({ title: 'Second', completed: true }).expect(201);

    const res = await request(app).get('/todos').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    expect(res.body.map((todo) => todo.title)).toEqual(['First', 'Second']);
    expect(res.body.map((todo) => todo.id)).toEqual(['1', '2']);
  });

  it('GET /todos/:id returns a todo', async () => {
    const created = await request(app)
      .post('/todos')
      .send({ title: 'Read me' })
      .expect(201);

    const res = await request(app).get(`/todos/${created.body.id}`).expect(200);

    expect(res.body).toEqual(created.body);
  });

  it('PATCH /todos/:id updates only provided fields', async () => {
    const created = await request(app)
      .post('/todos')
      .send({ title: 'Original', description: 'Keep me' })
      .expect(201);

    const res = await request(app)
      .patch(`/todos/${created.body.id}`)
      .send({ title: 'Updated', completed: true })
      .expect(200);

    expect(res.body).toMatchObject({
      id: created.body.id,
      title: 'Updated',
      description: 'Keep me',
      completed: true,
      created_at: created.body.created_at,
    });
  });

  it('DELETE /todos/:id removes a todo', async () => {
    const created = await request(app)
      .post('/todos')
      .send({ title: 'Delete me' })
      .expect(201);

    await request(app).delete(`/todos/${created.body.id}`).expect(204);

    await request(app).get(`/todos/${created.body.id}`).expect(404);
    const list = await request(app).get('/todos').expect(200);
    expect(list.body).toEqual([]);
  });

  it('returns 400 for invalid create bodies', async () => {
    await request(app).post('/todos').send({}).expect(400);
    await request(app).post('/todos').send({ title: '   ' }).expect(400);
    await request(app).post('/todos').send({ title: 'Invalid', description: 123 }).expect(400);
    await request(app).post('/todos').send({ title: 'Invalid', completed: 'yes' }).expect(400);
  });

  it('returns 400 for invalid update bodies', async () => {
    const created = await request(app)
      .post('/todos')
      .send({ title: 'Patch validation' })
      .expect(201);

    await request(app).patch(`/todos/${created.body.id}`).send({ title: '' }).expect(400);
    await request(app).patch(`/todos/${created.body.id}`).send({ description: false }).expect(400);
    await request(app).patch(`/todos/${created.body.id}`).send({ completed: 'no' }).expect(400);
  });

  it('returns 404 for missing IDs', async () => {
    await request(app).get('/todos/missing').expect(404);
    await request(app).patch('/todos/missing').send({ title: 'Nope' }).expect(404);
    await request(app).delete('/todos/missing').expect(404);
  });
});
