const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let app;
let mongoServer;

const validBook = {
  name: 'The Left Hand of Darkness',
  details: 'A science fiction novel about culture and identity.',
  authors: ['Ursula K. Le Guin'],
};

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

function expectSerializedBook(book) {
  expect(book).toHaveProperty('id');
  expect(book).not.toHaveProperty('_id');
  expect(book).not.toHaveProperty('__v');
  expect(book).toHaveProperty('name');
  expect(book).toHaveProperty('details');
  expect(book).toHaveProperty('authors');
  expect(book).toHaveProperty('starred');
}

describe('Books API', () => {
  it('GET /books lists serialized books', async () => {
    const created = await request(app).post('/books').send(validBook).expect(201);

    const res = await request(app).get('/books').expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toEqual(created.body);
    expectSerializedBook(res.body[0]);
  });

  it('GET /books returns an empty list when there are no books', async () => {
    const res = await request(app).get('/books').expect(200);

    expect(res.body).toEqual([]);
  });

  it('POST /books creates a book with starred defaulting to false', async () => {
    const res = await request(app).post('/books').send(validBook).expect(201);

    expectSerializedBook(res.body);
    expect(res.body).toMatchObject({
      name: validBook.name,
      details: validBook.details,
      authors: validBook.authors,
      starred: false,
    });
  });

  it('POST /books rejects invalid create bodies', async () => {
    const missingAuthors = await request(app)
      .post('/books')
      .send({ name: 'Incomplete', details: 'No author list' })
      .expect(400);
    expect(missingAuthors.body).toHaveProperty('error');

    const blankAuthor = await request(app)
      .post('/books')
      .send({ name: 'Incomplete', details: 'Blank author', authors: [''] })
      .expect(400);
    expect(blankAuthor.body).toHaveProperty('error');
  });

  it('GET /books/:id returns a serialized book by id', async () => {
    const created = await request(app).post('/books').send(validBook).expect(201);

    const res = await request(app).get(`/books/${created.body.id}`).expect(200);

    expect(res.body).toEqual(created.body);
    expectSerializedBook(res.body);
  });

  it('GET /books/:id returns 400 for invalid ids and 404 for missing books', async () => {
    await request(app).get('/books/not-a-valid-id').expect(400);

    const missingId = new mongoose.Types.ObjectId().toString();
    await request(app).get(`/books/${missingId}`).expect(404);
  });

  it('PATCH /books/:id updates editable book fields', async () => {
    const created = await request(app).post('/books').send(validBook).expect(201);

    const res = await request(app)
      .patch(`/books/${created.body.id}`)
      .send({ name: 'A Wizard of Earthsea', authors: ['Ursula Le Guin', 'UKLG'] })
      .expect(200);

    expectSerializedBook(res.body);
    expect(res.body).toMatchObject({
      id: created.body.id,
      name: 'A Wizard of Earthsea',
      details: validBook.details,
      authors: ['Ursula Le Guin', 'UKLG'],
      starred: false,
    });
  });

  it('PATCH /books/:id rejects invalid bodies and returns 404 for missing books', async () => {
    const created = await request(app).post('/books').send(validBook).expect(201);

    await request(app).patch(`/books/${created.body.id}`).send({ authors: [] }).expect(400);
    await request(app).patch(`/books/${created.body.id}`).send({ starred: true }).expect(400);

    const missingId = new mongoose.Types.ObjectId().toString();
    await request(app).patch(`/books/${missingId}`).send({ details: 'New details' }).expect(404);
  });

  it('PATCH /books/:id/starred updates only the starred field', async () => {
    const created = await request(app).post('/books').send(validBook).expect(201);

    const res = await request(app)
      .patch(`/books/${created.body.id}/starred`)
      .send({ starred: true, name: 'Ignored title' })
      .expect(200);

    expectSerializedBook(res.body);
    expect(res.body).toMatchObject({
      id: created.body.id,
      name: validBook.name,
      details: validBook.details,
      authors: validBook.authors,
      starred: true,
    });
  });

  it('PATCH /books/:id/starred rejects invalid bodies and returns 404 for missing books', async () => {
    const created = await request(app).post('/books').send(validBook).expect(201);

    await request(app).patch(`/books/${created.body.id}/starred`).send({ starred: 'yes' }).expect(400);

    const missingId = new mongoose.Types.ObjectId().toString();
    await request(app).patch(`/books/${missingId}/starred`).send({ starred: true }).expect(404);
  });

  it('DELETE /books/:id removes a book', async () => {
    const created = await request(app).post('/books').send(validBook).expect(201);

    await request(app).delete(`/books/${created.body.id}`).expect(204);

    await request(app).get(`/books/${created.body.id}`).expect(404);
  });

  it('DELETE /books/:id returns 400 for invalid ids and 404 for missing books', async () => {
    await request(app).delete('/books/not-a-valid-id').expect(400);

    const missingId = new mongoose.Types.ObjectId().toString();
    await request(app).delete(`/books/${missingId}`).expect(404);
  });
});
