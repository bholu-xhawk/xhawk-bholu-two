const { request, setupDatabase, cleanupDatabase, teardownDatabase, registerUser } = require('./testUtils');

let app;

beforeAll(async () => { app = await setupDatabase(); });
afterEach(cleanupDatabase);
afterAll(teardownDatabase);

describe('Authenticated profile API', () => {
  it('does not expose the old open users CRUD surface', async () => {
    await request(app).post('/users').send({ name: 'Alice', email: 'alice@example.com' }).expect(401);
    await request(app).get('/users/me').expect(401);
  });

  it('returns and updates the signed-in profile', async () => {
    const alice = await registerUser({ name: 'Alice', email: 'alice@example.com' });
    const token = `Bearer ${alice.token}`;

    const me = await request(app).get('/users/me').set('Authorization', token).expect(200);
    expect(me.body.user.email).toBe('alice@example.com');
    expect(me.body.user.passwordHash).toBeUndefined();

    const updated = await request(app)
      .patch('/users/me')
      .set('Authorization', token)
      .send({ name: 'Alice Updated', defaultCurrency: 'eur', notificationPreferences: { inAppReminders: false } })
      .expect(200);

    expect(updated.body.user.name).toBe('Alice Updated');
    expect(updated.body.user.defaultCurrency).toBe('EUR');
    expect(updated.body.user.notificationPreferences.inAppReminders).toBe(false);
  });
});
