const router = require('express').Router();

let users = [];
let nextId = 1;

function createMockUser({ name, email }) {
  const now = new Date().toISOString();
  return {
    id: String(nextId++),
    name,
    email,
    createdAt: now,
    updatedAt: now,
  };
}

function findUserIndex(id) {
  return users.findIndex((user) => user.id === id);
}

function hasEmail(email, ignoredId) {
  return users.some((user) => user.email === email && user.id !== ignoredId);
}

// Create
router.post('/', (req, res) => {
  const { name, email } = req.body || {};
  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' });
  }
  if (hasEmail(email)) {
    return res.status(409).json({ error: 'email already exists' });
  }

  const user = createMockUser({ name, email });
  users.push(user);
  return res.status(201).json(user);
});

// List all
router.get('/', (_req, res) => {
  return res.json(users);
});

// Get by id
router.get('/:id', (req, res) => {
  const index = findUserIndex(req.params.id);
  if (index === -1) return res.status(404).json({ error: 'not found' });
  return res.json(users[index]);
});

// Update partial
router.patch('/:id', (req, res) => {
  const index = findUserIndex(req.params.id);
  if (index === -1) return res.status(404).json({ error: 'not found' });

  const updates = {};
  if (req.body && typeof req.body.name === 'string') updates.name = req.body.name;
  if (req.body && typeof req.body.email === 'string') updates.email = req.body.email;

  const emailWasUpdated = Object.prototype.hasOwnProperty.call(updates, 'email');
  if (emailWasUpdated && hasEmail(updates.email, req.params.id)) {
    return res.status(409).json({ error: 'email already exists' });
  }

  users[index] = {
    ...users[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  return res.json(users[index]);
});

// Delete
router.delete('/:id', (req, res) => {
  const index = findUserIndex(req.params.id);
  if (index === -1) return res.status(404).json({ error: 'not found' });

  users.splice(index, 1);
  return res.status(204).send();
});

module.exports = router;
