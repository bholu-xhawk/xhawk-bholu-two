const { request, setupDatabase, cleanupDatabase, teardownDatabase, registerUser, createGroup, addMember } = require('./testUtils');

let app;

beforeAll(async () => { app = await setupDatabase(); });
afterEach(cleanupDatabase);
afterAll(teardownDatabase);

describe('Notifications', () => {
  it('creates in-app settlement reminders for unsettled balances and marks them read', async () => {
    const alice = await registerUser({ name: 'Alice', email: 'alice@example.com' });
    const bob = await registerUser({ name: 'Bob', email: 'bob@example.com' });
    const group = await createGroup(alice.token);
    await addMember(alice.token, group._id, bob.user.email);

    await request(app)
      .post(`/groups/${group._id}/expenses`)
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ description: 'Taxi', paidBy: alice.user._id, amountMinor: 2400, splitType: 'equal' })
      .expect(201);

    const created = await request(app)
      .post(`/groups/${group._id}/notifications/reminders`)
      .set('Authorization', `Bearer ${alice.token}`)
      .send({})
      .expect(201);
    expect(created.body).toHaveLength(1);

    const list = await request(app).get('/notifications').set('Authorization', `Bearer ${bob.token}`).expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({ unread: true, type: 'settlement_reminder' });
    expect(list.body[0].message).toContain('Alice');

    const read = await request(app).patch(`/notifications/${list.body[0]._id}/read`).set('Authorization', `Bearer ${bob.token}`).send({}).expect(200);
    expect(read.body.unread).toBe(false);
  });
});
