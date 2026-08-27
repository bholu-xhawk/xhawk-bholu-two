const router = require('express').Router();
const mongoose = require('mongoose');
const Todo = require('../models/Todo');

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
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

router.get('/todos', async (_req, res) => {
  const todos = await Todo.find().sort({ createdAt: -1, _id: -1 }).lean();
  return res.json(todos.map(serialize));
});

router.post('/todos', async (req, res) => {
  const { title } = req.body || {};

  if (typeof title !== 'string' || title.trim().length === 0) {
    return res.status(422).json({ error: 'title is required' });
  }

  const todo = await Todo.create({ title: title.trim() });
  return res.status(201).json(serialize(todo));
});

router.patch('/todos/:id', async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }

  if (!req.body || typeof req.body.completed !== 'boolean') {
    return res.status(422).json({ error: 'completed must be a boolean' });
  }

  const todo = await Todo.findByIdAndUpdate(
    id,
    { completed: req.body.completed },
    { new: true, runValidators: true }
  );

  if (!todo) return res.status(404).json({ error: 'not found' });
  return res.json(serialize(todo));
});

router.delete('/todos/:id', async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }

  const deleted = await Todo.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ error: 'not found' });
  return res.status(204).send();
});

module.exports = router;
