const request = require('supertest');
const app = require('../src/app');

describe('User posts CRUD', () => {
  it('POST /user-posts creates a mocked user post', async () => {
    const res = await request(app)
      .post('/user-posts')
      .send({ userId: 'user-9', title: 'New post', content: 'Created from a test.' })
      .expect(201);

    expect(res.body).toEqual({
      id: 'post-created',
      userId: 'user-9',
      title: 'New post',
      content: 'Created from a test.',
      createdAt: '2024-02-01T00:00:00.000Z',
      updatedAt: '2024-02-01T00:00:00.000Z',
    });
  });

  it('GET /user-posts lists mocked user posts', async () => {
    const res = await request(app).get('/user-posts').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(3);
    expect(res.body[0]).toMatchObject({
      id: 'post-1',
      userId: 'user-1',
      title: 'First mock user post',
      content: 'This is an example mocked user post.',
    });
    expect(res.body[0]).toHaveProperty('createdAt');
    expect(res.body[0]).toHaveProperty('updatedAt');
  });

  it('GET /user-posts filters mocked posts by userId', async () => {
    const res = await request(app).get('/user-posts?userId=user-1').expect(200);

    expect(res.body.map((post) => post.id)).toEqual(['post-1', 'post-3']);
    expect(res.body.every((post) => post.userId === 'user-1')).toBe(true);
  });

  it('GET /user-posts/:id returns a mocked user post', async () => {
    const res = await request(app).get('/user-posts/post-2').expect(200);

    expect(res.body).toMatchObject({
      id: 'post-2',
      userId: 'user-2',
      title: 'Second mock user post',
      content: 'Another example mocked user post.',
    });
  });

  it('PATCH /user-posts/:id returns a mocked updated user post', async () => {
    const res = await request(app)
      .patch('/user-posts/post-1')
      .send({ title: 'Updated title', content: 'Updated content.' })
      .expect(200);

    expect(res.body).toMatchObject({
      id: 'post-1',
      userId: 'user-1',
      title: 'Updated title',
      content: 'Updated content.',
      updatedAt: '2024-02-02T00:00:00.000Z',
    });
  });

  it('DELETE /user-posts/:id returns a mocked deletion response', async () => {
    const res = await request(app).delete('/user-posts/post-3').expect(200);

    expect(res.body).toEqual({
      message: 'user post deleted',
      post: {
        id: 'post-3',
        userId: 'user-1',
        title: 'User one follow-up',
        content: 'A second mocked post for the same user.',
        createdAt: '2024-01-03T00:00:00.000Z',
        updatedAt: '2024-01-03T00:00:00.000Z',
      },
    });
  });

  it('POST /user-posts validates required fields', async () => {
    const res = await request(app)
      .post('/user-posts')
      .send({ userId: 'user-9', title: 'Missing content' })
      .expect(400);

    expect(res.body).toEqual({ error: 'userId, title, and content are required' });
  });

  it('PATCH /user-posts/:id rejects an empty update body', async () => {
    const res = await request(app).patch('/user-posts/post-1').send({}).expect(400);

    expect(res.body).toEqual({ error: 'at least one supported field is required' });
  });

  it('PATCH /user-posts/:id rejects unsupported field types', async () => {
    const res = await request(app)
      .patch('/user-posts/post-1')
      .send({ title: 123 })
      .expect(400);

    expect(res.body).toEqual({ error: 'title must be a non-empty string' });
  });

  it('returns 404 for unknown post ids', async () => {
    await request(app).get('/user-posts/missing-post').expect(404, { error: 'not found' });
    await request(app).patch('/user-posts/missing-post').send({ title: 'Nope' }).expect(404, { error: 'not found' });
    await request(app).delete('/user-posts/missing-post').expect(404, { error: 'not found' });
  });
});
