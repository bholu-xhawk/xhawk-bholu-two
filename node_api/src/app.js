const express = require("express");

const todosRouter = require('./routes/todos');

const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    name: 'Patch TODO API',
    storage: 'in-memory',
    todos: '/api/todos',
  });
});

app.use('/api/todos', todosRouter);

app.use((err, _req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'malformed JSON body' });
  }

  return next(err);
});

app.use((req, res) => {
  res.status(404).json({ error: `route not found: ${req.method} ${req.originalUrl}` });
});

module.exports = app;
