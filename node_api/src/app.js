const express = require('express');
const cors = require('cors');
const { CORS_ORIGINS } = require('./config');
const usersRouter = require('./routes/users');
const { router: booksRouter } = require('./routes/books');

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || CORS_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
  })
);
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hello, World!' });
});

app.use('/users', usersRouter);
app.use('/books', booksRouter);

module.exports = app;
