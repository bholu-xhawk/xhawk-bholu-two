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

describe('Books API', () => {
  it('GET /books seeds defaults once and lists books', async () => {
    const first = await request(app).get('/books').expect(200);
    expect(first.body.length).toBeGreaterThanOrEqual(3);
    expect(first.body.map((book) => book.title)).toContain('Clean Code');

    const second = await request(app).get('/books').expect(200);
    expect(second.body).toHaveLength(first.body.length);
  });

  it('POST /books creates a book and requires title and author', async () => {
    const invalid = await request(app).post('/books').send({ title: 'No Author' }).expect(400);
    expect(invalid.body.error).toMatch(/title and author are required/);

    const res = await request(app)
      .post('/books')
      .send({
        title: 'Kindred',
        author: 'Octavia E. Butler',
        genre: 'Science Fiction',
        year: 1979,
        status: 'finished',
        rating: 5,
        description: 'A time-travel novel that confronts the brutality of slavery.',
        imageUrl: 'https://example.com/kindred.jpg',
      })
      .expect(201);

    expect(res.body).toHaveProperty('_id');
    expect(res.body.title).toBe('Kindred');
    expect(res.body.author).toBe('Octavia E. Butler');
    expect(res.body.imageUrl).toBe('https://example.com/kindred.jpg');
  });

  it('GET /books/:id returns a book and handles invalid or missing ids', async () => {
    const created = await request(app).post('/books').send({ title: 'Dune', author: 'Frank Herbert' }).expect(201);

    const res = await request(app).get(`/books/${created.body._id}`).expect(200);
    expect(res.body._id).toBe(created.body._id);
    expect(res.body.title).toBe('Dune');

    await request(app).get('/books/not-an-id').expect(400);
    await request(app).get(`/books/${new mongoose.Types.ObjectId()}`).expect(404);
  });

  it('PATCH /books/:id updates a book and handles invalid or missing ids', async () => {
    const created = await request(app).post('/books').send({ title: 'Dune', author: 'Frank Herbert' }).expect(201);

    const res = await request(app)
      .patch(`/books/${created.body._id}`)
      .send({ status: 'reading', rating: 4, description: 'Desert planet politics.' })
      .expect(200);

    expect(res.body.status).toBe('reading');
    expect(res.body.rating).toBe(4);
    expect(res.body.description).toBe('Desert planet politics.');

    await request(app).patch('/books/not-an-id').send({ title: 'Nope' }).expect(400);
    await request(app).patch(`/books/${new mongoose.Types.ObjectId()}`).send({ title: 'Missing' }).expect(404);
  });

  it('DELETE /books/:id removes one book and handles invalid or missing ids', async () => {
    const created = await request(app).post('/books').send({ title: 'Beloved', author: 'Toni Morrison' }).expect(201);

    await request(app).delete(`/books/${created.body._id}`).expect(204);
    await request(app).get(`/books/${created.body._id}`).expect(404);

    await request(app).delete('/books/not-an-id').expect(400);
    await request(app).delete(`/books/${new mongoose.Types.ObjectId()}`).expect(404);
  });

  it('POST /books/bulk-delete deletes selected books and reports missing ids', async () => {
    const first = await request(app).post('/books').send({ title: 'Book One', author: 'A' }).expect(201);
    const second = await request(app).post('/books').send({ title: 'Book Two', author: 'B' }).expect(201);
    const missingId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .post('/books/bulk-delete')
      .send({ ids: [first.body._id, second.body._id, missingId] })
      .expect(200);

    expect(res.body).toEqual({ deletedCount: 2, notFoundIds: [missingId] });
    await request(app).get(`/books/${first.body._id}`).expect(404);
    await request(app).get(`/books/${second.body._id}`).expect(404);
  });

  it('POST /books/bulk-delete validates ids input', async () => {
    await request(app).post('/books/bulk-delete').send({}).expect(400);
    await request(app).post('/books/bulk-delete').send({ ids: [] }).expect(400);
    await request(app).post('/books/bulk-delete').send({ ids: ['not-an-id'] }).expect(400);
  });
});
