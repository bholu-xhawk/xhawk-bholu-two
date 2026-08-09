const { test, expect } = require('@playwright/test');

const fastApiUrl = process.env.E2E_FASTAPI_URL || 'http://127.0.0.1:8000';
const nodeApiUrl = process.env.E2E_NODE_API_URL || 'http://127.0.0.1:3000';

test('FastAPI root responds with hello world', async ({ request }) => {
  const response = await request.get(`${fastApiUrl}/`);

  await expect(response).toBeOK();
  expect(await response.json()).toEqual({ message: 'Hello, World!' });
});

test('Node API root responds with hello world', async ({ request }) => {
  const response = await request.get(`${nodeApiUrl}/`);

  await expect(response).toBeOK();
  expect(await response.json()).toEqual({ message: 'Hello, World!' });
});

test('Node API supports user CRUD against MongoDB', async ({ request }) => {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const email = `e2e-${unique}@example.com`;
  const updatedEmail = `e2e-updated-${unique}@example.com`;

  const createResponse = await request.post(`${nodeApiUrl}/users`, {
    data: { name: 'E2E User', email },
  });
  expect(createResponse.status()).toBe(201);
  const created = await createResponse.json();
  expect(created).toMatchObject({ name: 'E2E User', email });
  expect(created._id).toBeTruthy();

  const listResponse = await request.get(`${nodeApiUrl}/users`);
  await expect(listResponse).toBeOK();
  const users = await listResponse.json();
  expect(users.some((user) => user._id === created._id && user.email === email)).toBe(true);

  const getResponse = await request.get(`${nodeApiUrl}/users/${created._id}`);
  await expect(getResponse).toBeOK();
  expect(await getResponse.json()).toEqual(expect.objectContaining({
    _id: created._id,
    name: 'E2E User',
    email,
  }));

  const patchResponse = await request.patch(`${nodeApiUrl}/users/${created._id}`, {
    data: { name: 'Updated E2E User', email: updatedEmail },
  });
  await expect(patchResponse).toBeOK();
  expect(await patchResponse.json()).toEqual(expect.objectContaining({
    _id: created._id,
    name: 'Updated E2E User',
    email: updatedEmail,
  }));

  const deleteResponse = await request.delete(`${nodeApiUrl}/users/${created._id}`);
  expect(deleteResponse.status()).toBe(204);

  const getDeletedResponse = await request.get(`${nodeApiUrl}/users/${created._id}`);
  expect(getDeletedResponse.status()).toBe(404);

  const listAfterDeleteResponse = await request.get(`${nodeApiUrl}/users`);
  await expect(listAfterDeleteResponse).toBeOK();
  const usersAfterDelete = await listAfterDeleteResponse.json();
  expect(usersAfterDelete.some((user) => user._id === created._id)).toBe(false);
});
