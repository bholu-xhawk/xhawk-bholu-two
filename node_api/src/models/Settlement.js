const { Schema, model, Types } = require('mongoose');

const SettlementSchema = new Schema(
  {
    group: { type: Types.ObjectId, ref: 'Group', required: true, index: true },
    from: { type: Types.ObjectId, ref: 'User', required: true },
    to: { type: Types.ObjectId, ref: 'User', required: true },
    amountMinor: { type: Number, required: true, min: 1 },
    currency: { type: String, required: true, uppercase: true },
    note: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = model('Settlement', SettlementSchema);
