const router = require('express').Router();
const mongoose = require('mongoose');
const Book = require('../models/Book');

const allowedFields = ['title', 'author', 'genre', 'publishedYear'];

// Create
router.post('/', async (req, res) => {
  try {
    const { title, author, publishedYear, genre } = req.body || {};
    if (!title || !author) {
      return res.status(400).json({ error: 'title and author are required' });
    }
    const book = await Book.create({ title, author, publishedYear, genre });
    return res.status(201).json(book);
  } catch (_err) {
    return res.status(500).json({ error: 'internal error' });
  }
});

// List all
router.get('/', async (_req, res) => {
  const books = await Book.find().lean();
  return res.json(books);
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
  const updates = {};
  if (req.body) {
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }
  }
  try {
    const book = await Book.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
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
