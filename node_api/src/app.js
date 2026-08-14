const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hello, World!' });
});

const usersRouter = require('./routes/users');
const todosRouter = require('./routes/todos');

app.use('/users', usersRouter);
app.use('/todos', todosRouter);

module.exports = app;
