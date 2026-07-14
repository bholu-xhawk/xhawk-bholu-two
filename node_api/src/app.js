const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Hello, World!" });
});

const usersRouter = require('./routes/users');
const userPostsRouter = require('./routes/userPosts');

app.use('/users', usersRouter);
app.use('/user-posts', userPostsRouter);

module.exports = app;
