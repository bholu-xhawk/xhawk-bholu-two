const mongoose = require('mongoose');

const SizeSchema = new mongoose.Schema(
  {
    url: { type: String, required: true }, // relative /static/... path
    width: { type: Number },
    height: { type: Number },
    bytes: { type: Number },
    contentType: { type: String },
  },
  { _id: false }
);

const AttachmentSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizes: {
      original: { type: SizeSchema, required: true },
      medium: { type: SizeSchema, required: true },
      thumb: { type: SizeSchema, required: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attachment', AttachmentSchema);
