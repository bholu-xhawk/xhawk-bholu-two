const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Hello, World!" });
});

const usersRouter = require('./routes/users');
const booksRouter = require('./routes/books');

app.use('/users', usersRouter);
app.use('/books', booksRouter);

module.exports = app;
