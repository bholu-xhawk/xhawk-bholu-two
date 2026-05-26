const User = require('../models/User');
const mongoose = require('mongoose');

exports.createUser = async (req, res) => {
  try {
    const { name, email } = req.body || {};
    if (!name || !email) {
      return res.status(400).json({ error: 'name and email are required' });
    }
    const user = await User.create({ name, email });
    res.status(201).json(user);
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ error: 'email already exists' });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.listUsers = async (_req, res) => {
  try {
    const users = await User.find({}).lean();
    res.json(users);
  } catch (_err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'invalid id' });
    }
    const user = await User.findById(id).lean();
    if (!user) {
      return res.status(404).json({ error: 'not found' });
    }
    res.json(user);
  } catch (_err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'invalid id' });
    }
    const { name, email } = req.body || {};
    const update = {};
    if (name !== undefined) update.name = name;
    if (email !== undefined) update.email = email;

    const user = await User.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!user) {
      return res.status(404).json({ error: 'not found' });
    }
    res.json(user);
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ error: 'email already exists' });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'invalid id' });
    }
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ error: 'not found' });
    }
    res.status(204).send();
  } catch (_err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
