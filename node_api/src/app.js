const express = require("express");

const booksRouter = require('./routes/books');
const usersRouter = require('./routes/users');

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || 'http://localhost:5173');
  res.header('Vary', 'Origin');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});

app.get("/", (req, res) => {
  res.json({ message: "Hello, World!" });
});

app.use('/books', booksRouter);
app.use('/users', usersRouter);

module.exports = app;
