const { request, setupDatabase, cleanupDatabase, teardownDatabase, registerUser, createGroup, addMember } = require('./testUtils');

let app;

beforeAll(async () => { app = await setupDatabase(); });
afterEach(cleanupDatabase);
afterAll(teardownDatabase);

async function groupWithTwoMembers() {
  const alice = await registerUser({ name: 'Alice', email: 'alice@example.com' });
  const bob = await registerUser({ name: 'Bob', email: 'bob@example.com' });
  const group = await createGroup(alice.token, { name: 'Dinner' });
  await addMember(alice.token, group._id, bob.user.email);
  return { alice, bob, group };
}

describe('Expenses', () => {
  it('creates equal-split expenses in minor units and exposes simplified balances', async () => {
    const { alice, bob, group } = await groupWithTwoMembers();

    const expense = await request(app)
      .post(`/groups/${group._id}/expenses`)
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ description: 'Dinner', paidBy: alice.user._id, amountMinor: 5000, currency: 'USD', splitType: 'equal' })
      .expect(201);

    expect(expense.body.convertedAmountMinor).toBe(5000);
    expect(expense.body.shares.map((share) => share.amountMinor)).toEqual([2500, 2500]);

    const balances = await request(app).get(`/groups/${group._id}/balances`).set('Authorization', `Bearer ${alice.token}`).expect(200);
    expect(balances.body).toHaveLength(1);
    expect(balances.body[0]).toMatchObject({ fromName: 'Bob', toName: 'Alice', amountMinor: 2500, currency: 'USD' });
    await request(app).get(`/groups/${group._id}/expenses`).set('Authorization', `Bearer ${bob.token}`).expect(200);
  });

  it('rejects custom shares that do not sum to the converted total', async () => {
    const { alice, bob, group } = await groupWithTwoMembers();

    await request(app)
      .post(`/groups/${group._id}/expenses`)
      .set('Authorization', `Bearer ${alice.token}`)
      .send({
        description: 'Groceries',
        paidBy: alice.user._id,
        amountMinor: 3000,
        splitType: 'custom',
        shares: [
          { user: alice.user._id, amountMinor: 1000 },
          { user: bob.user._id, amountMinor: 1000 },
        ],
      })
      .expect(400);
  });
});
