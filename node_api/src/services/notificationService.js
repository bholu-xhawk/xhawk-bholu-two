const Notification = require('../models/Notification');
const { getGroupBalances } = require('./balanceService');

async function createSettlementReminders(group) {
  const balances = await getGroupBalances(group._id);
  const created = [];
  for (const balance of balances) {
    const notification = await Notification.create({
      user: balance.from,
      group: group._id,
      type: 'settlement_reminder',
      title: 'Settlement reminder',
      message: `You owe ${balance.toName} ${(balance.amountMinor / 100).toFixed(2)} ${balance.currency}`,
      metadata: { to: balance.to, amountMinor: balance.amountMinor, currency: balance.currency },
    });
    created.push(notification);
  }
  return created;
}

module.exports = { createSettlementReminders };
