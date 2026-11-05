const { Schema, model } = require('mongoose');

const requiredTrimmedString = {
  type: String,
  required: true,
  trim: true,
  validate: {
    validator(value) {
      return typeof value === 'string' && value.trim().length > 0;
    },
    message: 'field is required',
  },
};

const CustomerSchema = new Schema(
  {
    name: requiredTrimmedString,
    email: {
      ...requiredTrimmedString,
      lowercase: true,
    },
    company: requiredTrimmedString,
    status: requiredTrimmedString,
    signedUpAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

CustomerSchema.index({ name: 1, _id: 1 });
CustomerSchema.index({ email: 1, _id: 1 });
CustomerSchema.index({ company: 1, _id: 1 });
CustomerSchema.index({ status: 1, _id: 1 });
CustomerSchema.index({ signedUpAt: 1, _id: 1 });

module.exports = model('Customer', CustomerSchema);
