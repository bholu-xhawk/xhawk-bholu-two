const { Schema, model } = require('mongoose');
const { DEFAULT_CURRENCY } = require('../config');

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    defaultCurrency: { type: String, required: true, uppercase: true, default: DEFAULT_CURRENCY },
    notificationPreferences: {
      inAppReminders: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

UserSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

module.exports = model('User', UserSchema);
