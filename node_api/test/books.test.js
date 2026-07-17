const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let app;
let mongoServer;

beforeAll(async () => {
  // Spin up in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Set env var before requiring app/index to ensure connection uses this URI
  process.env.MONGODB_URI = uri;

  // Connect mongoose to the in-memory server
  await mongoose.connect(uri);

  // Require the express app (no HTTP server started)
  app = require('../src/app');
});

afterEach(async () => {
  // Clean all collections
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

describe('Books CRUD', () => {
  it('POST /books creates a book', async () => {
    const res = await request(app)
      .post('/books')
      .send({ title: 'Dune', author: 'Frank Herbert', publishedYear: 1965, genre: 'Science Fiction' })
      .expect(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.title).toBe('Dune');
    expect(res.body.author).toBe('Frank Herbert');
    expect(res.body.publishedYear).toBe(1965);
    expect(res.body.genre).toBe('Science Fiction');
  });

  it('GET /books lists books', async () => {
    await request(app).post('/books').send({ title: 'Kindred', author: 'Octavia E. Butler' });
    const res = await request(app).get('/books').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe('Kindred');
  });

  it('GET /books/:id returns a book', async () => {
    const created = await request(app).post('/books').send({ title: 'Beloved', author: 'Toni Morrison' }).expect(201);
    const id = created.body._id;
    const res = await request(app).get(`/books/${id}`).expect(200);
    expect(res.body._id).toBe(id);
    expect(res.body.author).toBe('Toni Morrison');
  });

  it('PATCH /books/:id updates a book', async () => {
    const created = await request(app).post('/books').send({ title: 'The Hobbit', author: 'J.R.R. Tolkien' }).expect(201);
    const id = created.body._id;
    const res = await request(app).patch(`/books/${id}`).send({ genre: 'Fantasy', publishedYear: 1937 }).expect(200);
    expect(res.body.title).toBe('The Hobbit');
    expect(res.body.genre).toBe('Fantasy');
    expect(res.body.publishedYear).toBe(1937);
  });

  it('DELETE /books/:id removes a book', async () => {
    const created = await request(app).post('/books').send({ title: 'Invisible Man', author: 'Ralph Ellison' }).expect(201);
    const id = created.body._id;
    await request(app).delete(`/books/${id}`).expect(204);

    await request(app).get(`/books/${id}`).expect(404);
  });

  it('POST /books rejects requests without required fields', async () => {
    const missingTitle = await request(app).post('/books').send({ author: 'Ursula K. Le Guin' }).expect(400);
    expect(missingTitle.body).toEqual({ error: 'title and author are required' });

    const missingAuthor = await request(app).post('/books').send({ title: 'The Left Hand of Darkness' }).expect(400);
    expect(missingAuthor.body).toEqual({ error: 'title and author are required' });
  });

  it('returns 400 for invalid ids', async () => {
    await request(app).get('/books/not-an-id').expect(400);
    await request(app).patch('/books/not-an-id').send({ title: 'Updated' }).expect(400);
    await request(app).delete('/books/not-an-id').expect(400);
  });
});
