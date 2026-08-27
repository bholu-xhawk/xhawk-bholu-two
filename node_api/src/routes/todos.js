const router = require('express').Router();
const mongoose = require('mongoose');
const Todo = require('../models/Todo');
const { requireAuth } = require('../auth');

function isValidId(id) {
  return mongoose.isValidObjectId(id);
}

function serialize(todo) {
  const value = typeof todo.toObject === 'function' ? todo.toObject() : todo;
  const id = value._id.toString();
  return {
    id,
    _id: id,
    title: value.title,
    completed: value.completed,
    userId: value.userId.toString(),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

router.use('/todos', requireAuth);

router.get('/todos', async (req, res) => {
  try {
    const todos = await Todo.find({ userId: req.user.id }).sort({ createdAt: -1, _id: -1 }).lean();
    return res.json(todos.map(serialize));
  } catch (_err) {
    return res.status(500).json({ error: 'internal error' });
  }
});

router.post('/todos', async (req, res) => {
  const { title } = req.body || {};

  if (typeof title !== 'string' || title.trim().length === 0) {
    return res.status(422).json({ error: 'title is required' });
  }

  try {
    const todo = await Todo.create({ title: title.trim(), userId: req.user.id });
    return res.status(201).json(serialize(todo));
  } catch (_err) {
    return res.status(500).json({ error: 'internal error' });
  }
});

router.patch('/todos/:id', async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }

  if (!req.body || typeof req.body.completed !== 'boolean') {
    return res.status(422).json({ error: 'completed must be a boolean' });
  }

  try {
    const todo = await Todo.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { completed: req.body.completed },
      { new: true, runValidators: true }
    );

    if (!todo) return res.status(404).json({ error: 'not found' });
    return res.json(serialize(todo));
  } catch (_err) {
    return res.status(500).json({ error: 'internal error' });
  }
});

router.delete('/todos/:id', async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }

  try {
    const deleted = await Todo.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!deleted) return res.status(404).json({ error: 'not found' });
    return res.status(204).send();
  } catch (_err) {
    return res.status(500).json({ error: 'internal error' });
  }
});

module.exports = router;
