const express = require("express");

const app = express();

app.use(express.json());
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', frontendOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).send();
  return next();
});

app.get("/", (req, res) => {
  res.json({ message: "Hello, World!" });
});

const usersRouter = require('./routes/users');
const booksRouter = require('./routes/books');

app.use('/users', usersRouter);
app.use('/books', booksRouter);

module.exports = app;
