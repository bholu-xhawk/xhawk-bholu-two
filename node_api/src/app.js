const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Hello, World!" });
});

app.post('/student', (req, res) => {
  const studentData = req.body || {};
  res.status(201).json({
    message: 'Student created successfully',
    student: studentData,
  });
});

const usersRouter = require('./routes/users');
app.use('/users', usersRouter);

module.exports = app;
