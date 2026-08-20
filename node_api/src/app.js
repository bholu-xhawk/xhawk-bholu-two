const express = require('express');
const { ZodError } = require('zod');

const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const groupsRouter = require('./routes/groups');
const expensesRouter = require('./routes/expenses');
const balancesRouter = require('./routes/balances');
const settlementsRouter = require('./routes/settlements');
const notificationsRouter = require('./routes/notifications');
const { requireAuth } = require('./middleware/auth');
const { publicUser } = require('./services/authService');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ name: 'Shared Expense API', status: 'ok' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRouter);
app.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));
app.use('/users', usersRouter);
app.use('/groups', groupsRouter);
app.use('/groups/:groupId/expenses', expensesRouter);
app.use('/groups/:groupId/balances', balancesRouter);
app.use('/groups/:groupId/settlements', settlementsRouter);
app.use('/notifications', notificationsRouter);

app.use((req, res) => res.status(404).json({ error: 'not found' }));

app.use((err, req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'validation failed', details: err.issues });
  }
  if (err && err.status) return res.status(err.status).json({ error: err.message });
  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(500).json({ error: 'internal error' });
});

module.exports = app;
