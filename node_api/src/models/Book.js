const { Schema, model } = require('mongoose');

const BookSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    details: { type: String, required: true, trim: true },
    authors: {
      type: [
        {
          type: String,
          trim: true,
        },
      ],
      required: true,
      validate: {
        validator(authors) {
          return Array.isArray(authors) && authors.length > 0 && authors.every(Boolean);
        },
        message: 'authors must include at least one author',
      },
    },
    starred: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

BookSchema.statics.serialize = function serialize(book) {
  if (!book) return null;
  const value = typeof book.toJSON === 'function' ? book.toJSON() : { ...book };
  if (!value.id && value._id) value.id = value._id.toString();
  delete value._id;
  delete value.__v;
  return value;
};

module.exports = model('Book', BookSchema);
