const { Schema, model, Types } = require('mongoose');
const { DEFAULT_CURRENCY } = require('../config');

const MemberSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['owner', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const GroupSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    baseCurrency: { type: String, required: true, uppercase: true, default: DEFAULT_CURRENCY },
    members: { type: [MemberSchema], default: [] },
    createdBy: { type: Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = model('Group', GroupSchema);
