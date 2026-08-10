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

function createBook(overrides = {}) {
  return request(app)
    .post('/books')
    .send({ title: 'The Hobbit', author: 'J.R.R. Tolkien', price: 12.99, ...overrides });
}

describe('Books CRUD', () => {
  it('POST /books rejects missing or invalid fields', async () => {
    await request(app)
      .post('/books')
      .send({ title: '', author: 'Author', price: 10 })
      .expect(400);

    await request(app)
      .post('/books')
      .send({ title: 'Book', author: 'Author', price: -1 })
      .expect(400);

    await request(app)
      .post('/books')
      .send({ title: 'Book', price: 10 })
      .expect(400);
  });

  it('POST /books creates a book', async () => {
    const res = await createBook({ title: 'Dune', author: 'Frank Herbert', price: 9.5 }).expect(201);

    expect(res.body).toHaveProperty('_id');
    expect(res.body.title).toBe('Dune');
    expect(res.body.author).toBe('Frank Herbert');
    expect(res.body.price).toBe(9.5);
    expect(res.body).toHaveProperty('createdAt');
  });

  it('GET /books returns the default first page with pagination metadata', async () => {
    for (let i = 0; i < 25; i += 1) {
      await createBook({ title: `Book ${i}`, author: `Author ${i}`, price: i + 0.99 }).expect(201);
    }

    const res = await request(app).get('/books').expect(200);

    expect(res.body.items).toHaveLength(20);
    expect(res.body.total).toBe(25);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(20);
    expect(res.body.totalPages).toBe(2);
    expect(res.body.items[0].title).toBe('Book 24');
  });

  it('GET /books normalizes page and caps limit', async () => {
    for (let i = 0; i < 3; i += 1) {
      await createBook({ title: `Book ${i}`, author: `Author ${i}`, price: i }).expect(201);
    }

    const res = await request(app).get('/books?page=-3&limit=500').expect(200);

    expect(res.body.items).toHaveLength(3);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(100);
    expect(res.body.totalPages).toBe(1);
  });

  it('PATCH /books/:id updates a book', async () => {
    const created = await createBook({ title: 'Old Title', author: 'Author', price: 5 }).expect(201);

    const res = await request(app)
      .patch(`/books/${created.body._id}`)
      .send({ title: 'New Title', price: 7.25 })
      .expect(200);

    expect(res.body.title).toBe('New Title');
    expect(res.body.author).toBe('Author');
    expect(res.body.price).toBe(7.25);
  });

  it('PATCH /books/:id rejects invalid ids, invalid payloads, and missing records', async () => {
    await request(app)
      .patch('/books/not-an-id')
      .send({ title: 'New Title' })
      .expect(400);

    const created = await createBook().expect(201);
    await request(app)
      .patch(`/books/${created.body._id}`)
      .send({ price: -2 })
      .expect(400);

    const missingId = new mongoose.Types.ObjectId();
    await request(app)
      .patch(`/books/${missingId}`)
      .send({ title: 'Missing' })
      .expect(404);
  });

  it('DELETE /books/:id removes a book', async () => {
    const created = await createBook().expect(201);

    await request(app).delete(`/books/${created.body._id}`).expect(204);

    const list = await request(app).get('/books').expect(200);
    expect(list.body.items).toHaveLength(0);
  });

  it('DELETE /books/:id rejects invalid ids and missing records', async () => {
    await request(app).delete('/books/not-an-id').expect(400);

    const missingId = new mongoose.Types.ObjectId();
    await request(app).delete(`/books/${missingId}`).expect(404);
  });
});
