const router = require('express').Router();
const { z } = require('zod');
const { requireAuth } = require('../middleware/auth');
const { publicUser } = require('../services/authService');

const profileSchema = z.object({
  name: z.string().trim().min(1).optional(),
  defaultCurrency: z.string().length(3).optional(),
  notificationPreferences: z.object({ inAppReminders: z.boolean().optional() }).optional(),
});

router.use(requireAuth);

router.get('/me', (req, res) => res.json({ user: publicUser(req.user) }));

router.patch('/me', async (req, res, next) => {
  try {
    const input = profileSchema.parse(req.body || {});
    if (input.name) req.user.name = input.name;
    if (input.defaultCurrency) req.user.defaultCurrency = input.defaultCurrency.toUpperCase();
    if (input.notificationPreferences) {
      req.user.notificationPreferences = {
        ...req.user.notificationPreferences,
        ...input.notificationPreferences,
      };
    }
    await req.user.save();
    return res.json({ user: publicUser(req.user) });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
