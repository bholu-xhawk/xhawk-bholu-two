const { Schema, model, Types } = require('mongoose');

const ShareSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true },
    amountMinor: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const ExpenseSchema = new Schema(
  {
    group: { type: Types.ObjectId, ref: 'Group', required: true, index: true },
    description: { type: String, required: true, trim: true },
    paidBy: { type: Types.ObjectId, ref: 'User', required: true },
    participants: [{ type: Types.ObjectId, ref: 'User', required: true }],
    splitType: { type: String, enum: ['equal', 'custom'], required: true },
    currency: { type: String, required: true, uppercase: true },
    amountMinor: { type: Number, required: true, min: 1 },
    baseCurrency: { type: String, required: true, uppercase: true },
    fxRate: { type: Number, required: true, min: 0 },
    convertedAmountMinor: { type: Number, required: true, min: 1 },
    shares: { type: [ShareSchema], required: true },
  },
  { timestamps: true }
);

module.exports = model('Expense', ExpenseSchema);
