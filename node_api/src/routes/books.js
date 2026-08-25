const router = require('express').Router();
const mongoose = require('mongoose');
const Book = require('../models/Book');

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeAuthors(authors) {
  if (!Array.isArray(authors)) return null;
  const normalized = authors
    .filter((author) => typeof author === 'string')
    .map((author) => author.trim());

  if (normalized.length !== authors.length || normalized.length === 0 || normalized.some((author) => !author)) {
    return null;
  }

  return normalized;
}

function validateCreateBook(body) {
  if (!body || !isNonEmptyString(body.name) || !isNonEmptyString(body.details)) {
    return { error: 'name, details, and authors are required' };
  }

  const authors = normalizeAuthors(body.authors);
  if (!authors) {
    return { error: 'authors must be a non-empty array of strings' };
  }

  return {
    value: {
      name: body.name.trim(),
      details: body.details.trim(),
      authors,
      ...(typeof body.starred === 'boolean' ? { starred: body.starred } : {}),
    },
  };
}

function validateUpdateBook(body) {
  if (!body || typeof body !== 'object') {
    return { error: 'request body is required' };
  }

  const updates = {};

  if (Object.prototype.hasOwnProperty.call(body, 'name')) {
    if (!isNonEmptyString(body.name)) return { error: 'name must be a non-empty string' };
    updates.name = body.name.trim();
  }

  if (Object.prototype.hasOwnProperty.call(body, 'details')) {
    if (!isNonEmptyString(body.details)) return { error: 'details must be a non-empty string' };
    updates.details = body.details.trim();
  }

  if (Object.prototype.hasOwnProperty.call(body, 'authors')) {
    const authors = normalizeAuthors(body.authors);
    if (!authors) return { error: 'authors must be a non-empty array of strings' };
    updates.authors = authors;
  }

  if (Object.keys(updates).length === 0) {
    return { error: 'at least one editable book field is required' };
  }

  return { value: updates };
}

function validateObjectId(id) {
  return mongoose.isValidObjectId(id);
}

function handleError(res, err) {
  if (err && err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  return res.status(500).json({ error: 'internal error' });
}

router.get('/', async (_req, res) => {
  const books = await Book.find().sort({ createdAt: 1 });
  return res.json(books.map((book) => Book.serialize(book)));
});

router.post('/', async (req, res) => {
  const validation = validateCreateBook(req.body);
  if (validation.error) return res.status(400).json({ error: validation.error });

  try {
    const book = await Book.create(validation.value);
    return res.status(201).json(Book.serialize(book));
  } catch (err) {
    return handleError(res, err);
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!validateObjectId(id)) return res.status(400).json({ error: 'invalid id' });

  const book = await Book.findById(id);
  if (!book) return res.status(404).json({ error: 'not found' });

  return res.json(Book.serialize(book));
});

router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  if (!validateObjectId(id)) return res.status(400).json({ error: 'invalid id' });

  const validation = validateUpdateBook(req.body);
  if (validation.error) return res.status(400).json({ error: validation.error });

  try {
    const book = await Book.findByIdAndUpdate(id, validation.value, {
      new: true,
      runValidators: true,
    });

    if (!book) return res.status(404).json({ error: 'not found' });

    return res.json(Book.serialize(book));
  } catch (err) {
    return handleError(res, err);
  }
});

router.patch('/:id/starred', async (req, res) => {
  const { id } = req.params;
  if (!validateObjectId(id)) return res.status(400).json({ error: 'invalid id' });

  if (!req.body || typeof req.body.starred !== 'boolean') {
    return res.status(400).json({ error: 'starred must be a boolean' });
  }

  const book = await Book.findByIdAndUpdate(
    id,
    { starred: req.body.starred },
    { new: true, runValidators: true }
  );

  if (!book) return res.status(404).json({ error: 'not found' });

  return res.json(Book.serialize(book));
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  if (!validateObjectId(id)) return res.status(400).json({ error: 'invalid id' });

  const deleted = await Book.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ error: 'not found' });

  return res.status(204).send();
});

module.exports = router;
