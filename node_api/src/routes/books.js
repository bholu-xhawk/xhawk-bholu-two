const router = require('express').Router();
const mongoose = require('mongoose');
const Book = require('../models/Book');

const defaultBooks = [
  {
    _id: new mongoose.Types.ObjectId('000000000000000000000001'),
    title: 'The Pragmatic Programmer',
    author: 'Andrew Hunt and David Thomas',
    genre: 'Software Engineering',
    year: 1999,
    status: 'finished',
    rating: 5,
    description: 'Practical advice for improving the craft of software development.',
  },
  {
    _id: new mongoose.Types.ObjectId('000000000000000000000002'),
    title: 'Clean Code',
    author: 'Robert C. Martin',
    genre: 'Software Engineering',
    year: 2008,
    status: 'reading',
    rating: 4,
    description: 'A handbook of agile software craftsmanship and code quality practices.',
  },
  {
    _id: new mongoose.Types.ObjectId('000000000000000000000003'),
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    genre: 'Distributed Systems',
    year: 2017,
    status: 'to-read',
    description: 'A deep guide to modern data systems, reliability, scalability, and maintainability.',
  },
];

let seedDefaultsPromise = null;

function seedDefaultsIfEmpty() {
  if (!seedDefaultsPromise) {
    seedDefaultsPromise = (async () => {
      const count = await Book.countDocuments();
      if (count === 0) {
        await Book.bulkWrite(defaultBooks.map((book) => ({
          updateOne: {
            filter: { _id: book._id },
            update: { $setOnInsert: book },
            upsert: true,
          },
        })));
      }
    })().finally(() => {
      seedDefaultsPromise = null;
    });
  }

  return seedDefaultsPromise;
}

function buildBookPayload(body = {}, { requireRequired = false } = {}) {
  const payload = {};
  const stringFields = ['title', 'author', 'genre', 'description', 'imageUrl', 'status'];

  for (const field of stringFields) {
    if (typeof body[field] === 'string') payload[field] = body[field];
  }

  if (body.year !== undefined && body.year !== null && body.year !== '') {
    const year = Number(body.year);
    if (!Number.isFinite(year)) {
      const error = new Error('year must be a number');
      error.status = 400;
      throw error;
    }
    payload.year = year;
  }
  if (body.rating !== undefined && body.rating !== null && body.rating !== '') {
    const rating = Number(body.rating);
    if (!Number.isFinite(rating)) {
      const error = new Error('rating must be a number');
      error.status = 400;
      throw error;
    }
    payload.rating = rating;
  }

  if (requireRequired && (!payload.title || !payload.author)) {
    const error = new Error('title and author are required');
    error.status = 400;
    throw error;
  }

  return payload;
}

function validateIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    return 'ids must be a non-empty array';
  }
  if (!ids.every((id) => mongoose.isValidObjectId(id))) {
    return 'ids must contain only valid ids';
  }
  return null;
}

// Bulk delete selected books
router.post('/bulk-delete', async (req, res) => {
  const ids = req.body && req.body.ids;
  const validationError = validateIds(ids);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const uniqueIds = [...new Set(ids)];
  const existingBooks = await Book.find({ _id: { $in: uniqueIds } }).select('_id').lean();
  const existingIds = existingBooks.map((book) => book._id.toString());
  const existingIdSet = new Set(existingIds);
  const notFoundIds = uniqueIds.filter((id) => !existingIdSet.has(id));

  const result = existingIds.length
    ? await Book.deleteMany({ _id: { $in: existingIds } })
    : { deletedCount: 0 };

  return res.json({ deletedCount: result.deletedCount || 0, notFoundIds });
});

// List all, seeding defaults for first-run use
router.get('/', async (_req, res) => {
  await seedDefaultsIfEmpty();
  const books = await Book.find().sort({ title: 1, author: 1 }).lean();
  return res.json(books);
});

// Create
router.post('/', async (req, res) => {
  try {
    const payload = buildBookPayload(req.body, { requireRequired: true });
    const book = await Book.create(payload);
    return res.status(201).json(book);
  } catch (err) {
    if (err && err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'internal error' });
  }
});

// Get by id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }
  const book = await Book.findById(id);
  if (!book) return res.status(404).json({ error: 'not found' });
  return res.json(book);
});

// Update partial
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }

  try {
    const body = req.body || {};
    const updates = buildBookPayload(body);
    const unset = {};
    if (body.year === null) unset.year = '';
    if (body.rating === null) unset.rating = '';
    const update = Object.keys(unset).length
      ? { ...(Object.keys(updates).length ? { $set: updates } : {}), $unset: unset }
      : updates;
    const book = await Book.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!book) return res.status(404).json({ error: 'not found' });
    return res.json(book);
  } catch (err) {
    if (err && err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
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
