const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Hello, World!" });
});

const usersRouter = require('./routes/users');
const todosRouter = require('./routes/todos');
const customersRouter = require('./routes/customers');

app.use('/users', usersRouter);
app.use('/api/todos', todosRouter);
app.use('/api/customers', customersRouter);

module.exports = app;
