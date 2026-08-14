const router = require('express').Router();
const mongoose = require('mongoose');
const Todo = require('../models/Todo');

function isBlank(value) {
  return typeof value !== 'string' || value.trim().length === 0;
}

function todoUpdates(body) {
  const updates = {};
  if (!body) return updates;

  if (typeof body.title === 'string') updates.title = body.title;
  if (typeof body.description === 'string') updates.description = body.description;
  if (typeof body.completed === 'boolean') updates.completed = body.completed;

  return updates;
}

// Create
router.post('/', async (req, res) => {
  try {
    const { title, description, completed } = req.body || {};
    if (isBlank(title)) {
      return res.status(400).json({ error: 'title is required' });
    }
    if (description !== undefined && typeof description !== 'string') {
      return res.status(400).json({ error: 'description must be a string' });
    }
    if (completed !== undefined && typeof completed !== 'boolean') {
      return res.status(400).json({ error: 'completed must be a boolean' });
    }

    const todo = await Todo.create({ title, description, completed });
    return res.status(201).json(todo);
  } catch (_err) {
    return res.status(500).json({ error: 'internal error' });
  }
});

// List all newest first
router.get('/', async (_req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1, _id: -1 }).lean();
    return res.json(todos);
  } catch (_err) {
    return res.status(500).json({ error: 'internal error' });
  }
});

// Get by id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }

  try {
    const todo = await Todo.findById(id);
    if (!todo) return res.status(404).json({ error: 'not found' });
    return res.json(todo);
  } catch (_err) {
    return res.status(500).json({ error: 'internal error' });
  }
});

// Update partial
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }

  if (req.body && Object.prototype.hasOwnProperty.call(req.body, 'title') && isBlank(req.body.title)) {
    return res.status(400).json({ error: 'title is required' });
  }
  if (req.body && Object.prototype.hasOwnProperty.call(req.body, 'description') && typeof req.body.description !== 'string') {
    return res.status(400).json({ error: 'description must be a string' });
  }
  if (req.body && Object.prototype.hasOwnProperty.call(req.body, 'completed') && typeof req.body.completed !== 'boolean') {
    return res.status(400).json({ error: 'completed must be a boolean' });
  }

  try {
    const updates = todoUpdates(req.body);
    const todo = await Todo.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!todo) return res.status(404).json({ error: 'not found' });
    return res.json(todo);
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

  try {
    const deleted = await Todo.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'not found' });
    return res.status(204).send();
  } catch (_err) {
    return res.status(500).json({ error: 'internal error' });
  }
});

module.exports = router;
