const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Customer = require('../src/models/Customer');

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
  jest.restoreAllMocks();
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

function customer(index, overrides = {}) {
  return {
    name: `Customer ${String(index).padStart(2, '0')}`,
    email: `customer${String(index).padStart(2, '0')}@example.com`,
    company: `Company ${index % 5}`,
    status: index % 2 === 0 ? 'active' : 'prospect',
    signedUpAt: new Date(Date.UTC(2024, 0, index + 1)),
    ...overrides,
  };
}

async function seed(customers) {
  return Customer.insertMany(customers, { ordered: true });
}

function expectEnvelope(body, overrides = {}) {
  expect(body).toMatchObject({
    page: overrides.page ?? 1,
    pageSize: 20,
    total: overrides.total,
    totalPages: overrides.totalPages,
  });
  expect(Array.isArray(body.items)).toBe(true);
}

describe('Customers API', () => {
  it('lists default results by signedUpAt descending with 20-row pages', async () => {
    await seed(Array.from({ length: 25 }, (_, index) => customer(index + 1)));

    const firstPage = await request(app).get('/api/customers').expect(200);
    expectEnvelope(firstPage.body, { total: 25, totalPages: 2 });
    expect(firstPage.body.items).toHaveLength(20);
    expect(firstPage.body.items[0].email).toBe('customer25@example.com');
    expect(firstPage.body.items[19].email).toBe('customer06@example.com');

    const secondPage = await request(app).get('/api/customers?page=2').expect(200);
    expectEnvelope(secondPage.body, { page: 2, total: 25, totalPages: 2 });
    expect(secondPage.body.items.map((item) => item.email)).toEqual([
      'customer05@example.com',
      'customer04@example.com',
      'customer03@example.com',
      'customer02@example.com',
      'customer01@example.com',
    ]);
  });

  it('searches name and email prefixes case-insensitively and reports filtered totals', async () => {
    await seed([
      customer(1, { name: 'Acme Primary', email: 'primary@example.com' }),
      customer(2, { name: 'Other Customer', email: 'acme-contact@example.com' }),
      customer(3, { name: 'Customer Acme', email: 'contact@acme.test' }),
    ]);

    const result = await request(app).get('/api/customers?search= ACME ').expect(200);
    expectEnvelope(result.body, { total: 2, totalPages: 1 });
    expect(result.body.items.map((item) => item.email).sort()).toEqual(['acme-contact@example.com', 'primary@example.com']);
  });

  it('treats regex metacharacters in search as literal text', async () => {
    await seed([
      customer(1, { name: 'Regex.* Literal', email: 'literal@example.com' }),
      customer(2, { name: 'RegexABC Literal', email: 'regexabc@example.com' }),
    ]);

    const result = await request(app).get('/api/customers?search=Regex.*').expect(200);
    expectEnvelope(result.body, { total: 1, totalPages: 1 });
    expect(result.body.items[0].email).toBe('literal@example.com');
  });

  it('sorts every allowed field in both directions with _id ties', async () => {
    const olderId = new mongoose.Types.ObjectId('000000000000000000000001');
    const newerId = new mongoose.Types.ObjectId('000000000000000000000002');
    await seed([
      customer(1, {
        _id: olderId,
        name: 'Alpha',
        email: 'alpha@example.com',
        company: 'Shared Co',
        status: 'active',
        signedUpAt: new Date('2024-01-01T00:00:00.000Z'),
      }),
      customer(2, {
        _id: newerId,
        name: 'Bravo',
        email: 'bravo@example.com',
        company: 'Shared Co',
        status: 'active',
        signedUpAt: new Date('2024-01-02T00:00:00.000Z'),
      }),
      customer(3, {
        name: 'Charlie',
        email: 'charlie@example.com',
        company: 'Zulu Co',
        status: 'prospect',
        signedUpAt: new Date('2024-01-03T00:00:00.000Z'),
      }),
    ]);

    const expected = {
      name: { asc: ['Alpha', 'Bravo', 'Charlie'], desc: ['Charlie', 'Bravo', 'Alpha'], field: 'name' },
      email: {
        asc: ['alpha@example.com', 'bravo@example.com', 'charlie@example.com'],
        desc: ['charlie@example.com', 'bravo@example.com', 'alpha@example.com'],
        field: 'email',
      },
      company: { asc: ['Alpha', 'Bravo', 'Charlie'], desc: ['Charlie', 'Bravo', 'Alpha'], field: 'name' },
      status: { asc: ['Alpha', 'Bravo', 'Charlie'], desc: ['Charlie', 'Bravo', 'Alpha'], field: 'name' },
      signedUpAt: { asc: ['Alpha', 'Bravo', 'Charlie'], desc: ['Charlie', 'Bravo', 'Alpha'], field: 'name' },
    };

    for (const [sort, config] of Object.entries(expected)) {
      for (const direction of ['asc', 'desc']) {
        const result = await request(app).get(`/api/customers?sort=${sort}&direction=${direction}`).expect(200);
        expect(result.body.items.map((item) => item[config.field])).toEqual(config[direction]);
      }
    }
  });

  it('returns empty items for valid pages beyond the filtered result set', async () => {
    await seed([customer(1), customer(2)]);

    const result = await request(app).get('/api/customers?page=5').expect(200);
    expectEnvelope(result.body, { page: 5, total: 2, totalPages: 1 });
    expect(result.body.items).toEqual([]);
  });

  it('returns empty metadata for an empty collection', async () => {
    const result = await request(app).get('/api/customers').expect(200);
    expectEnvelope(result.body, { total: 0, totalPages: 0 });
    expect(result.body.items).toEqual([]);
  });

  it('rejects malformed page, sort, and direction query values', async () => {
    await request(app).get('/api/customers?page=0').expect(400, { error: 'page must be a positive integer' });
    await request(app).get('/api/customers?page=1.5').expect(400, { error: 'page must be a positive integer' });
    await request(app).get('/api/customers?page=500001').expect(400, { error: 'page must be no greater than 500' });
    await request(app).get('/api/customers?sort=password').expect(400, {
      error: 'sort must be one of name, email, company, status, signedUpAt',
    });
    await request(app).get('/api/customers?direction=sideways').expect(400, { error: 'direction must be asc or desc' });
  });

  it('rejects repeated query parameters', async () => {
    await request(app).get('/api/customers?page=2&page=3').expect(400, { error: 'page must not be repeated' });
    await request(app).get('/api/customers?sort=name&sort=email').expect(400, { error: 'sort must not be repeated' });
    await request(app)
      .get('/api/customers?direction=asc&direction=desc')
      .expect(400, { error: 'direction must not be repeated' });
    await request(app).get('/api/customers?search=ada&search=grace').expect(400, { error: 'search must not be repeated' });
  });

  it('returns the repository error shape when the database query fails', async () => {
    jest.spyOn(Customer, 'countDocuments').mockImplementationOnce(() => Promise.reject(new Error('database down')));

    await request(app).get('/api/customers').expect(500, { error: 'internal error' });
  });
});
