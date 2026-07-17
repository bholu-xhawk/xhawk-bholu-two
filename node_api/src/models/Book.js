const { Schema, model } = require('mongoose');

const BookSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    publishedYear: { type: Number },
    genre: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = model('Book', BookSchema);
