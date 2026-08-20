const router = require('express').Router({ mergeParams: true });
const { requireAuth } = require('../middleware/auth');
const { requireGroupMember } = require('../middleware/groupAccess');
const { getGroupBalances, recomputeGroupBalances } = require('../services/balanceService');

router.use(requireAuth, requireGroupMember());

router.get('/', async (req, res) => {
  const balances = await getGroupBalances(req.group._id);
  return res.json(balances);
});

router.post('/recompute', async (req, res, next) => {
  try {
    const balances = await recomputeGroupBalances(req.group);
    return res.json(balances);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
