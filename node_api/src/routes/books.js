const router = require('express').Router();
const mongoose = require('mongoose');
const Book = require('../models/Book');

const DEFAULT_BOOKS = [
  { name: 'Clean Code', authors: ['Robert C. Martin'], starred: false },
  { name: 'Designing Data-Intensive Applications', authors: ['Martin Kleppmann'], starred: true },
  { name: 'The Pragmatic Programmer', authors: ['Andrew Hunt', 'David Thomas'], starred: false },
];

function serializeBook(book) {
  return {
    id: book._id.toString(),
    name: book.name,
    authors: book.authors,
    starred: book.starred,
  };
}

async function seedDefaultBooks() {
  const existingCount = await Book.countDocuments();
  if (existingCount > 0) return;

  await Book.insertMany(DEFAULT_BOOKS, { ordered: true });
}

router.get('/', async (_req, res) => {
  try {
    await seedDefaultBooks();
    const books = await Book.find().sort({ name: 1, _id: 1 });
    return res.json(books.map(serializeBook));
  } catch (_err) {
    return res.status(500).json({ error: 'internal error' });
  }
});

router.patch('/:id/starred', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }

  if (!req.body || typeof req.body.starred !== 'boolean') {
    return res.status(400).json({ error: 'starred must be a boolean' });
  }

  try {
    const book = await Book.findByIdAndUpdate(
      id,
      { starred: req.body.starred },
      { new: true, runValidators: true }
    );

    if (!book) return res.status(404).json({ error: 'not found' });

    return res.json(serializeBook(book));
  } catch (_err) {
    return res.status(500).json({ error: 'internal error' });
  }
});

module.exports = { router, seedDefaultBooks, serializeBook, DEFAULT_BOOKS };
