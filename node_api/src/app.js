const express = require("express");

const app = express();

app.use(express.json());

const student = {
  id: "123",
  name: "John Doe",
  age: 20,
  grade: "A",
};

app.get("/", (req, res) => {
  res.json({ message: "Hello, World!" });
});

app.get("/student", (_req, res) => {
  res.json(student);
});

const usersRouter = require('./routes/users');
app.use('/users', usersRouter);

module.exports = app;
