const router = require('express').Router();
const mongoose = require('mongoose');
const Book = require('../models/Book');

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function normalizePagination(query) {
  const parsedPage = Number.parseInt(query.page, 10);
  const parsedLimit = Number.parseInt(query.limit, 10);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limit = Number.isInteger(parsedLimit) && parsedLimit > 0
    ? Math.min(parsedLimit, MAX_LIMIT)
    : DEFAULT_LIMIT;

  return { page, limit };
}

function parseBookPayload(body, { partial = false } = {}) {
  const payload = {};
  const errors = [];
  const input = body || {};

  if (!partial || Object.prototype.hasOwnProperty.call(input, 'title')) {
    if (typeof input.title !== 'string' || input.title.trim() === '') {
      errors.push('title is required');
    } else {
      payload.title = input.title;
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(input, 'author')) {
    if (typeof input.author !== 'string' || input.author.trim() === '') {
      errors.push('author is required');
    } else {
      payload.author = input.author;
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(input, 'price')) {
    if (typeof input.price !== 'number' || !Number.isFinite(input.price) || input.price < 0) {
      errors.push('price must be a non-negative number');
    } else {
      payload.price = input.price;
    }
  }

  if (partial && Object.keys(payload).length === 0 && errors.length === 0) {
    errors.push('at least one of title, author, or price is required');
  }

  return { payload, errors };
}

// Create
router.post('/', async (req, res) => {
  const { payload, errors } = parseBookPayload(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') });
  }

  try {
    const book = await Book.create(payload);
    return res.status(201).json(book);
  } catch (_err) {
    return res.status(500).json({ error: 'internal error' });
  }
});

// Paginated list
router.get('/', async (req, res) => {
  const { page, limit } = normalizePagination(req.query || {});
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Book.find().sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
    Book.countDocuments(),
  ]);

  return res.json({
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

// Update partial
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }

  const { payload, errors } = parseBookPayload(req.body, { partial: true });
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') });
  }

  try {
    const book = await Book.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!book) return res.status(404).json({ error: 'not found' });
    return res.json(book);
  } catch (_err) {
    return res.status(500).json({ error: 'internal error' });
  }
});

// Delete
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }

  const deleted = await Book.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ error: 'not found' });
  return res.status(204).send();
});

module.exports = router;
