const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET, JWT_EXPIRES_IN, DEFAULT_CURRENCY } = require('../config');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function publicUser(user) {
  if (!user) return null;
  const obj = typeof user.toJSON === 'function' ? user.toJSON() : user;
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
}

function issueJwt(user) {
  return jwt.sign({ sub: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

async function registerUser({ name, email, password, defaultCurrency }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: String(name).trim(),
    email: normalizeEmail(email),
    passwordHash,
    defaultCurrency: (defaultCurrency || DEFAULT_CURRENCY).toUpperCase(),
  });
  return { user: publicUser(user), token: issueJwt(user) };
}

async function loginUser({ email, password }) {
  const user = await User.findOne({ email: normalizeEmail(email) });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return { user: publicUser(user), token: issueJwt(user) };
}

module.exports = { normalizeEmail, publicUser, issueJwt, registerUser, loginUser };
