const express = require("express");
const path = require('path');
const cors = require('cors');
const { UPLOAD_DIR } = require('./config');

const app = express();

app.use(cors());
app.use(express.json());

// Static files for uploads
app.use('/static', express.static(UPLOAD_DIR));

app.get("/", (req, res) => {
  res.json({ message: "Hello, World!" });
});

const usersRouter = require('./routes/users');
app.use('/users', usersRouter);

const uploadsRouter = require('./routes/uploads');
app.use('/uploads', uploadsRouter);

module.exports = app;

