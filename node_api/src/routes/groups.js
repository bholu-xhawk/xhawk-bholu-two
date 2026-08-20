const router = require('express').Router();
const { z } = require('zod');
const Group = require('../models/Group');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { requireGroupMember } = require('../middleware/groupAccess');
const { publicUser, normalizeEmail } = require('../services/authService');
const { createSettlementReminders } = require('../services/notificationService');

const groupSchema = z.object({ name: z.string().trim().min(1), baseCurrency: z.string().length(3).optional() });
const memberSchema = z.object({ email: z.email(), role: z.enum(['member', 'owner']).optional() });

function sameId(a, b) {
  return a.toString() === b.toString();
}

async function serializeGroup(group) {
  const userIds = group.members.map((member) => member.user);
  const users = await User.find({ _id: { $in: userIds } });
  const byId = new Map(users.map((user) => [user._id.toString(), publicUser(user)]));
  const obj = group.toObject();
  obj.members = obj.members.map((member) => ({ ...member, user: byId.get(member.user.toString()) || member.user }));
  return obj;
}

router.use(requireAuth);

router.get('/', async (req, res) => {
  const groups = await Group.find({ 'members.user': req.user._id }).sort({ updatedAt: -1 });
  return res.json(await Promise.all(groups.map(serializeGroup)));
});

router.post('/', async (req, res, next) => {
  try {
    const input = groupSchema.parse(req.body || {});
    const group = await Group.create({
      name: input.name,
      baseCurrency: (input.baseCurrency || req.user.defaultCurrency).toUpperCase(),
      createdBy: req.user._id,
      members: [{ user: req.user._id, role: 'owner' }],
    });
    return res.status(201).json(await serializeGroup(group));
  } catch (err) {
    return next(err);
  }
});

router.get('/:groupId', requireGroupMember(), async (req, res) => res.json(await serializeGroup(req.group)));

router.post('/:groupId/members', requireGroupMember({ roles: ['owner'] }), async (req, res, next) => {
  try {
    const input = memberSchema.parse(req.body || {});
    const user = await User.findOne({ email: normalizeEmail(input.email) });
    if (!user) return res.status(404).json({ error: 'user not found' });
    if (!req.group.members.some((member) => sameId(member.user, user._id))) {
      req.group.members.push({ user: user._id, role: input.role || 'member' });
      await req.group.save();
    }
    return res.status(201).json(await serializeGroup(req.group));
  } catch (err) {
    return next(err);
  }
});

router.post('/:groupId/notifications/reminders', requireGroupMember(), async (req, res, next) => {
  try {
    const notifications = await createSettlementReminders(req.group);
    return res.status(201).json(notifications);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
