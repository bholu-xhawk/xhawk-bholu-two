const { Schema, model } = require('mongoose');

const TodoSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = model('Todo', TodoSchema);
