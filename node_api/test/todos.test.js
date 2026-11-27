const request = require('supertest');
const app = require('../src/app');

const expectedTodos = [
  {
    id: 'mock-todo-1',
    title: 'Review the mocked todo endpoint',
    completed: true,
  },
  {
    id: 'mock-todo-2',
    title: 'Render read-only todo rows',
    completed: false,
  },
  {
    id: 'mock-todo-3',
    title: 'Keep the users sample backed by MongoDB',
    completed: false,
  },
];

describe('Todos API', () => {
  it('returns the deterministic mocked todos in stable order', async () => {
    const first = await request(app).get('/api/todos').expect(200);
    const second = await request(app).get('/api/todos').expect(200);

    expect(first.body).toEqual(expectedTodos);
    expect(second.body).toEqual(expectedTodos);
  });

  it('does not route unsupported todo mutation methods', async () => {
    await request(app).post('/api/todos').send({ title: 'New todo' }).expect(404);
    await request(app).patch('/api/todos/mock-todo-1').send({ completed: false }).expect(404);
    await request(app).delete('/api/todos/mock-todo-1').expect(404);
  });
});
