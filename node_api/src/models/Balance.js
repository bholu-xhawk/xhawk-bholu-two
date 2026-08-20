const { Schema, model, Types } = require('mongoose');

const BalanceSchema = new Schema(
  {
    group: { type: Types.ObjectId, ref: 'Group', required: true, index: true },
    from: { type: Types.ObjectId, ref: 'User', required: true },
    to: { type: Types.ObjectId, ref: 'User', required: true },
    amountMinor: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, uppercase: true },
  },
  { timestamps: true }
);

BalanceSchema.index({ group: 1, from: 1, to: 1 }, { unique: true });

module.exports = model('Balance', BalanceSchema);
