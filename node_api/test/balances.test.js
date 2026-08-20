const { request, setupDatabase, cleanupDatabase, teardownDatabase, registerUser, createGroup, addMember } = require('./testUtils');

let app;

beforeAll(async () => { app = await setupDatabase(); });
afterEach(cleanupDatabase);
afterAll(teardownDatabase);

describe('Balances and settlements', () => {
  it('updates simplified balances after recording a settlement', async () => {
    const alice = await registerUser({ name: 'Alice', email: 'alice@example.com' });
    const bob = await registerUser({ name: 'Bob', email: 'bob@example.com' });
    const group = await createGroup(alice.token);
    await addMember(alice.token, group._id, bob.user.email);

    await request(app)
      .post(`/groups/${group._id}/expenses`)
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ description: 'Hotel', paidBy: alice.user._id, amountMinor: 10000, splitType: 'equal' })
      .expect(201);

    let balances = await request(app).get(`/groups/${group._id}/balances`).set('Authorization', `Bearer ${bob.token}`).expect(200);
    expect(balances.body[0].amountMinor).toBe(5000);

    await request(app)
      .post(`/groups/${group._id}/settlements`)
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ from: bob.user._id, to: alice.user._id, amountMinor: 2000 })
      .expect(201);

    balances = await request(app).get(`/groups/${group._id}/balances`).set('Authorization', `Bearer ${alice.token}`).expect(200);
    expect(balances.body).toHaveLength(1);
    expect(balances.body[0]).toMatchObject({ fromName: 'Bob', toName: 'Alice', amountMinor: 3000 });
  });
});
