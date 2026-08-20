const router = require('express').Router();
const { z } = require('zod');
const { registerUser, loginUser, publicUser } = require('../services/authService');
const { requireAuth } = require('../middleware/auth');

const authSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.email(),
  password: z.string().min(8),
  defaultCurrency: z.string().length(3).optional(),
});

router.post('/register', async (req, res, next) => {
  try {
    const input = authSchema.extend({ name: z.string().trim().min(1) }).parse(req.body || {});
    const result = await registerUser(input);
    return res.status(201).json(result);
  } catch (err) {
    if (err && err.code === 11000) return res.status(409).json({ error: 'email already exists' });
    return next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const input = authSchema.omit({ name: true, defaultCurrency: true }).parse(req.body || {});
    const result = await loginUser(input);
    if (!result) return res.status(401).json({ error: 'invalid email or password' });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

router.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

module.exports = router;
