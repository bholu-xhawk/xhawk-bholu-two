const router = require('express').Router({ mergeParams: true });
const { z } = require('zod');
const Settlement = require('../models/Settlement');
const { requireAuth } = require('../middleware/auth');
const { requireGroupMember } = require('../middleware/groupAccess');
const { recomputeGroupBalances } = require('../services/balanceService');

const settlementSchema = z.object({
  from: z.string(),
  to: z.string(),
  amountMinor: z.number().int().positive(),
  note: z.string().optional(),
});

function isMember(group, userId) {
  return group.members.some((member) => member.user.toString() === userId.toString());
}

router.use(requireAuth, requireGroupMember());

router.get('/', async (req, res) => {
  const settlements = await Settlement.find({ group: req.group._id }).sort({ createdAt: -1 });
  return res.json(settlements);
});

router.post('/', async (req, res, next) => {
  try {
    const input = settlementSchema.parse(req.body || {});
    if (!isMember(req.group, input.from) || !isMember(req.group, input.to)) {
      return res.status(400).json({ error: 'settlement users must be group members' });
    }
    if (input.from === input.to) return res.status(400).json({ error: 'from and to must differ' });
    const settlement = await Settlement.create({
      group: req.group._id,
      from: input.from,
      to: input.to,
      amountMinor: input.amountMinor,
      currency: req.group.baseCurrency,
      note: input.note || '',
    });
    await recomputeGroupBalances(req.group);
    return res.status(201).json(settlement);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
