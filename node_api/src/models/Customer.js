const { Schema, model } = require('mongoose');

function normalizeForSearch(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

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
    nameSearch: {
      type: String,
      required: true,
      select: false,
    },
    emailSearch: {
      type: String,
      required: true,
      select: false,
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
CustomerSchema.index({ nameSearch: 1, _id: 1 });
CustomerSchema.index({ emailSearch: 1, _id: 1 });
CustomerSchema.index({ company: 1, _id: 1 });
CustomerSchema.index({ status: 1, _id: 1 });
CustomerSchema.index({ signedUpAt: 1, _id: 1 });

CustomerSchema.pre('validate', function setSearchFields(next) {
  this.nameSearch = normalizeForSearch(this.name);
  this.emailSearch = normalizeForSearch(this.email);
  next();
});

CustomerSchema.pre('insertMany', function setSearchFields(next, docs) {
  for (const doc of docs) {
    doc.nameSearch = normalizeForSearch(doc.name);
    doc.emailSearch = normalizeForSearch(doc.email);
  }
  next();
});

module.exports = model('Customer', CustomerSchema);
