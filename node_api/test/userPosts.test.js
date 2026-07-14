const request = require('supertest');
const app = require('../src/app');

describe('User posts mock API', () => {
  it('POST /users/:userId/posts creates a mock post for the path user', async () => {
    const res = await request(app)
      .post('/users/user-123/posts')
      .send({ title: 'Test title', body: 'Test body' })
      .expect(201);

    expect(res.body).toEqual({
      userId: 'user-123',
      postId: 'mock-post-1',
      title: 'Test title',
      body: 'Test body',
    });
  });

  it('GET /users/:userId/posts lists mock posts for the path user', async () => {
    const res = await request(app).get('/users/user-123/posts').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toMatchObject({
      userId: 'user-123',
      postId: 'mock-post-1',
      title: 'Mock post title',
      body: 'Mock post body',
    });
    expect(res.body[1]).toMatchObject({
      userId: 'user-123',
      postId: 'mock-post-2',
    });
  });

  it('GET /users/:userId/posts/:postId returns the requested mock post', async () => {
    const res = await request(app).get('/users/user-123/posts/post-456').expect(200);

    expect(res.body).toEqual({
      userId: 'user-123',
      postId: 'post-456',
      title: 'Mock post title',
      body: 'Mock post body',
    });
  });

  it('PUT /users/:userId/posts/:postId updates and returns a mock post', async () => {
    const res = await request(app)
      .put('/users/user-123/posts/post-456')
      .send({ title: 'Updated title', body: 'Updated body' })
      .expect(200);

    expect(res.body).toEqual({
      userId: 'user-123',
      postId: 'post-456',
      title: 'Updated title',
      body: 'Updated body',
    });
  });

  it('DELETE /users/:userId/posts/:postId deletes a mock post without a body', async () => {
    const res = await request(app).delete('/users/user-123/posts/post-456').expect(204);

    expect(res.text).toBe('');
  });
});
