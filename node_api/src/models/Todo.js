const { Schema, model } = require('mongoose');

const TodoSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator(value) {
          return typeof value === 'string' && value.trim().length > 0;
        },
        message: 'title is required',
      },
    },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = model('Todo', TodoSchema);
