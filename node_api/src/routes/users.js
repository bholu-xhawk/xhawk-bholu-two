const router = require('express').Router();
const mongoose = require('mongoose');
const User = require('../models/User');

// Create
router.post('/', async (req, res) => {
  try {
    const { name, email } = req.body || {};
    if (!name || !email) {
      return res.status(400).json({ error: 'name and email are required' });
    }
    const user = await User.create({ name, email });
    return res.status(201).json(user);
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ error: 'email already exists' });
    }
    return res.status(500).json({ error: 'internal error' });
  }
});

// List all
router.get('/', async (_req, res) => {
  const users = await User.find().lean();
  return res.json(users);
});

// Get by id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ error: 'not found' });
  return res.json(user);
});

// Update partial
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }
  const updates = {};
  if (req.body && typeof req.body.name === 'string') updates.name = req.body.name;
  if (req.body && typeof req.body.email === 'string') updates.email = req.body.email;
  try {
    const user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ error: 'not found' });
    return res.json(user);
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ error: 'email already exists' });
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
  const deleted = await User.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ error: 'not found' });
  return res.status(204).send();
});

module.exports = router;
