const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const Book = require('../src/models/Book');

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

describe('Books API', () => {
  it('GET /books seeds default books and returns normalized ordered rows', async () => {
    const res = await request(app).get('/books').expect(200);

    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.map((book) => book.name)).toEqual([
      'Clean Code',
      'Designing Data-Intensive Applications',
      'The Pragmatic Programmer',
    ]);

    for (const book of res.body) {
      expect(book).toEqual({
        id: expect.any(String),
        name: expect.any(String),
        authors: expect.arrayContaining([expect.any(String)]),
        starred: expect.any(Boolean),
      });
      expect(book).not.toHaveProperty('_id');
      expect(book).not.toHaveProperty('__v');
    }

    const countAfterFirstGet = await Book.countDocuments();
    await request(app).get('/books').expect(200);
    await expect(Book.countDocuments()).resolves.toBe(countAfterFirstGet);
  });

  it('PATCH /books/:id/starred flips one book and persists it for later reads', async () => {
    const list = await request(app).get('/books').expect(200);
    const book = list.body.find((item) => item.starred === false);

    const updated = await request(app)
      .patch(`/books/${book.id}/starred`)
      .send({ starred: true })
      .expect(200);

    expect(updated.body).toEqual({ ...book, starred: true });

    const laterList = await request(app).get('/books').expect(200);
    expect(laterList.body.find((item) => item.id === book.id).starred).toBe(true);
  });

  it('PATCH /books/:id/starred rejects a non-boolean starred payload', async () => {
    const list = await request(app).get('/books').expect(200);

    const res = await request(app)
      .patch(`/books/${list.body[0].id}/starred`)
      .send({ starred: 'true' })
      .expect(400);

    expect(res.body).toEqual({ error: 'starred must be a boolean' });
  });

  it('PATCH /books/:id/starred rejects invalid ids', async () => {
    const res = await request(app)
      .patch('/books/not-a-valid-object-id/starred')
      .send({ starred: true })
      .expect(400);

    expect(res.body).toEqual({ error: 'invalid id' });
  });

  it('PATCH /books/:id/starred returns 404 for unknown valid ids', async () => {
    const unknownId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .patch(`/books/${unknownId}/starred`)
      .send({ starred: true })
      .expect(404);

    expect(res.body).toEqual({ error: 'not found' });
  });
});
