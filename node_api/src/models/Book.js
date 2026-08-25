const { Schema, model } = require('mongoose');

const BookSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    authors: {
      type: [{ type: String, trim: true }],
      required: true,
      validate: {
        validator: (authors) => Array.isArray(authors) && authors.length > 0,
        message: 'at least one author is required',
      },
    },
    starred: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = model('Book', BookSchema);
