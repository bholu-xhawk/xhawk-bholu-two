const { Schema, model, Types } = require('mongoose');

const NotificationSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    group: { type: Types.ObjectId, ref: 'Group' },
    type: { type: String, enum: ['settlement_reminder'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    unread: { type: Boolean, default: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = model('Notification', NotificationSchema);
