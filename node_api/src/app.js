const express = require("express");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Hello, World!" });
});

app.use('/users', require('./routes/userRoutes'));

module.exports = app;
