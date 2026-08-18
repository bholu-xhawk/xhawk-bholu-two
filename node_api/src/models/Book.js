const { Schema, model } = require('mongoose');

const BookSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    genre: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    imageUrl: { type: String, trim: true, default: '' },
    year: { type: Number },
    status: {
      type: String,
      enum: ['to-read', 'reading', 'finished'],
      default: 'to-read',
    },
    rating: { type: Number, min: 0, max: 5 },
  },
  { timestamps: true }
);

module.exports = model('Book', BookSchema);
