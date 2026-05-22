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
    return res.status(400).json({ error: err.message || 'Invalid request' });
  }
});

// List
router.get('/', async (_req, res) => {
  const users = await User.find().lean();
  return res.json(users);
});

// Read by id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'invalid id' });
  const user = await User.findById(id).lean();
  if (!user) return res.status(404).json({ error: 'not found' });
  return res.json(user);
});

// Update (partial)
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'invalid id' });
  const updates = {};
  if (typeof req.body?.name === 'string') updates.name = req.body.name;
  if (typeof req.body?.email === 'string') updates.email = req.body.email;
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'no valid fields to update' });

  try {
    const user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ error: 'not found' });
    return res.json(user);
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ error: 'email already exists' });
    }
    return res.status(400).json({ error: err.message || 'Invalid request' });
  }
});

// Delete
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'invalid id' });
  const result = await User.findByIdAndDelete(id);
  if (!result) return res.status(404).json({ error: 'not found' });
  return res.status(204).send();
});

module.exports = router;
