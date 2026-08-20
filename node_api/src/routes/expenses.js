const router = require('express').Router({ mergeParams: true });
const { z } = require('zod');
const Expense = require('../models/Expense');
const { requireAuth } = require('../middleware/auth');
const { requireGroupMember } = require('../middleware/groupAccess');
const { createExpense } = require('../services/expenseService');

const shareSchema = z.object({ user: z.string(), amountMinor: z.number().int().nonnegative() });
const expenseSchema = z.object({
  description: z.string().trim().min(1),
  paidBy: z.string(),
  amountMinor: z.number().int().positive(),
  currency: z.string().length(3).optional(),
  fxRate: z.number().positive().optional(),
  splitType: z.enum(['equal', 'custom']).default('equal'),
  participants: z.array(z.string()).optional(),
  shares: z.array(shareSchema).optional(),
});

router.use(requireAuth, requireGroupMember());

router.get('/', async (req, res) => {
  const expenses = await Expense.find({ group: req.group._id }).sort({ createdAt: -1 });
  return res.json(expenses);
});

router.post('/', async (req, res, next) => {
  try {
    const input = expenseSchema.parse(req.body || {});
    const expense = await createExpense(req.group, input);
    return res.status(201).json(expense);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
