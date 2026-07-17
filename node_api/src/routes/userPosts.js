const router = require('express').Router();

const mockPosts = [
  {
    id: 'post-1',
    userId: 'user-1',
    title: 'First mock user post',
    content: 'This is an example mocked user post.',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'post-2',
    userId: 'user-2',
    title: 'Second mock user post',
    content: 'Another example mocked user post.',
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
  {
    id: 'post-3',
    userId: 'user-1',
    title: 'User one follow-up',
    content: 'A second mocked post for the same user.',
    createdAt: '2024-01-03T00:00:00.000Z',
    updatedAt: '2024-01-03T00:00:00.000Z',
  },
];

const createdAt = '2024-02-01T00:00:00.000Z';
const updatedAt = '2024-02-02T00:00:00.000Z';
const allowedFields = ['userId', 'title', 'content'];

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function findMockPostById(id) {
  return mockPosts.find((post) => post.id === id);
}

function validateCreatePost(body) {
  if (!body || typeof body !== 'object') {
    return 'userId, title, and content are required';
  }

  const missingFields = allowedFields.filter((field) => !isNonEmptyString(body[field]));
  if (missingFields.length > 0) {
    return 'userId, title, and content are required';
  }

  return null;
}

function validateUpdatePost(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'at least one supported field is required';
  }

  const fields = Object.keys(body);
  if (fields.length === 0) {
    return 'at least one supported field is required';
  }

  const unsupportedField = fields.find((field) => !allowedFields.includes(field));
  if (unsupportedField) {
    return `unsupported field: ${unsupportedField}`;
  }

  const invalidField = fields.find((field) => !isNonEmptyString(body[field]));
  if (invalidField) {
    return `${invalidField} must be a non-empty string`;
  }

  return null;
}

// Create
router.post('/', (req, res) => {
  const validationError = validateCreatePost(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  return res.status(201).json({
    id: 'post-created',
    userId: req.body.userId,
    title: req.body.title,
    content: req.body.content,
    createdAt,
    updatedAt: createdAt,
  });
});

// List all
router.get('/', (req, res) => {
  const { userId } = req.query;
  const posts = userId ? mockPosts.filter((post) => post.userId === userId) : mockPosts;
  return res.json(posts);
});

// Get by id
router.get('/:id', (req, res) => {
  const post = findMockPostById(req.params.id);
  if (!post) return res.status(404).json({ error: 'not found' });
  return res.json(post);
});

// Update partial
router.patch('/:id', (req, res) => {
  const post = findMockPostById(req.params.id);
  if (!post) return res.status(404).json({ error: 'not found' });

  const validationError = validateUpdatePost(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  return res.json({
    ...post,
    ...req.body,
    updatedAt,
  });
});

// Delete
router.delete('/:id', (req, res) => {
  const post = findMockPostById(req.params.id);
  if (!post) return res.status(404).json({ error: 'not found' });

  return res.json({
    message: 'user post deleted',
    post,
  });
});

module.exports = router;
