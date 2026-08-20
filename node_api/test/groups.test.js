const { request, setupDatabase, cleanupDatabase, teardownDatabase, registerUser, createGroup, addMember } = require('./testUtils');

let app;

beforeAll(async () => { app = await setupDatabase(); });
afterEach(cleanupDatabase);
afterAll(teardownDatabase);

describe('Groups and membership', () => {
  it('creates a group with the creator as owner and lists only signed-in user groups', async () => {
    const alice = await registerUser({ name: 'Alice', email: 'alice@example.com' });
    const bob = await registerUser({ name: 'Bob', email: 'bob@example.com' });

    const group = await createGroup(alice.token, { name: 'House', baseCurrency: 'USD' });
    expect(group.name).toBe('House');
    expect(group.members[0].role).toBe('owner');

    const aliceGroups = await request(app).get('/groups').set('Authorization', `Bearer ${alice.token}`).expect(200);
    const bobGroups = await request(app).get('/groups').set('Authorization', `Bearer ${bob.token}`).expect(200);
    expect(aliceGroups.body).toHaveLength(1);
    expect(bobGroups.body).toHaveLength(0);
  });

  it('allows owners to add registered members and blocks non-members from group detail', async () => {
    const alice = await registerUser({ email: 'alice@example.com' });
    const bob = await registerUser({ email: 'bob@example.com' });
    const carol = await registerUser({ email: 'carol@example.com' });
    const group = await createGroup(alice.token);

    const updated = await addMember(alice.token, group._id, bob.user.email);
    expect(updated.members.map((member) => member.user.email)).toContain('bob@example.com');

    await request(app).get(`/groups/${group._id}`).set('Authorization', `Bearer ${bob.token}`).expect(200);
    await request(app).get(`/groups/${group._id}`).set('Authorization', `Bearer ${carol.token}`).expect(403);
  });
});
