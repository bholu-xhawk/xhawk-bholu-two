const { Schema, model } = require('mongoose');

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function isValidDateOnly(value) {
  if (value === null || value === undefined) return true;
  if (typeof value !== 'string' || !DATE_ONLY_PATTERN.test(value)) return false;

  const [yearText, monthText, dayText] = value.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const daysByMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  return month >= 1 && month <= 12 && day >= 1 && day <= daysByMonth[month - 1];
}

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
    dueDate: {
      type: String,
      default: null,
      validate: {
        validator: isValidDateOnly,
        message: 'dueDate must be a valid YYYY-MM-DD date or null',
      },
    },
  },
  { timestamps: true }
);

TodoSchema.statics.isValidDateOnly = isValidDateOnly;

module.exports = model('Todo', TodoSchema);
