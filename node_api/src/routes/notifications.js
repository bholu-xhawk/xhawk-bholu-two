const router = require('express').Router();
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
  return res.json(notifications);
});

router.patch('/:notificationId/read', async (req, res) => {
  const { notificationId } = req.params;
  if (!mongoose.isValidObjectId(notificationId)) return res.status(400).json({ error: 'invalid notification id' });
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: req.user._id },
    { unread: false },
    { new: true }
  );
  if (!notification) return res.status(404).json({ error: 'notification not found' });
  return res.json(notification);
});

module.exports = router;
