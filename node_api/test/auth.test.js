const { request, setupDatabase, cleanupDatabase, teardownDatabase, registerUser } = require('./testUtils');

let app;

beforeAll(async () => { app = await setupDatabase(); });
afterEach(cleanupDatabase);
afterAll(teardownDatabase);

describe('Authentication', () => {
  it('registers an account, returns a token, and hides password hashes', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Alice', email: 'ALICE@example.com', password: 'password123', defaultCurrency: 'usd' })
      .expect(201);

    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe('alice@example.com');
    expect(res.body.user.defaultCurrency).toBe('USD');
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('logs in and allows access to /me with a bearer token', async () => {
    const registered = await registerUser({ email: 'bob@example.com', password: 'password123' });
    const login = await request(app)
      .post('/auth/login')
      .send({ email: 'bob@example.com', password: 'password123' })
      .expect(200);

    expect(login.body.token).toBeTruthy();
    const me = await request(app).get('/me').set('Authorization', `Bearer ${registered.token}`).expect(200);
    expect(me.body.user.email).toBe('bob@example.com');
  });

  it('rejects protected requests without a valid token', async () => {
    await request(app).get('/groups').expect(401);
    await request(app).get('/me').set('Authorization', 'Bearer bad-token').expect(401);
  });
});
