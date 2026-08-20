const Balance = require('../models/Balance');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const User = require('../models/User');

function idOf(value) {
  return value && value._id ? value._id.toString() : value.toString();
}

async function recomputeGroupBalances(group) {
  const groupId = idOf(group);
  const currency = group.baseCurrency;
  const memberIds = group.members.map((member) => idOf(member.user));
  const net = new Map(memberIds.map((memberId) => [memberId, 0]));

  const expenses = await Expense.find({ group: groupId });
  for (const expense of expenses) {
    const payerId = idOf(expense.paidBy);
    net.set(payerId, (net.get(payerId) || 0) + expense.convertedAmountMinor);
    for (const share of expense.shares) {
      const userId = idOf(share.user);
      net.set(userId, (net.get(userId) || 0) - share.amountMinor);
    }
  }

  const settlements = await Settlement.find({ group: groupId });
  for (const settlement of settlements) {
    const fromId = idOf(settlement.from);
    const toId = idOf(settlement.to);
    net.set(fromId, (net.get(fromId) || 0) + settlement.amountMinor);
    net.set(toId, (net.get(toId) || 0) - settlement.amountMinor);
  }

  const debtors = [];
  const creditors = [];
  for (const [userId, amount] of net.entries()) {
    if (amount < 0) debtors.push({ userId, amount: -amount });
    if (amount > 0) creditors.push({ userId, amount });
  }

  const simplified = [];
  let debtorIndex = 0;
  let creditorIndex = 0;
  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = Math.min(debtor.amount, creditor.amount);
    if (amount > 0) simplified.push({ group: groupId, from: debtor.userId, to: creditor.userId, amountMinor: amount, currency });
    debtor.amount -= amount;
    creditor.amount -= amount;
    if (debtor.amount === 0) debtorIndex += 1;
    if (creditor.amount === 0) creditorIndex += 1;
  }

  await Balance.deleteMany({ group: groupId });
  if (simplified.length > 0) await Balance.insertMany(simplified);
  return getGroupBalances(groupId);
}

async function getGroupBalances(groupId) {
  const balances = await Balance.find({ group: groupId }).lean();
  const userIds = [...new Set(balances.flatMap((balance) => [balance.from.toString(), balance.to.toString()]))];
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const names = new Map(users.map((user) => [user._id.toString(), user.name]));
  return balances.map((balance) => ({
    _id: balance._id,
    group: balance.group,
    from: balance.from,
    fromName: names.get(balance.from.toString()) || 'Unknown',
    to: balance.to,
    toName: names.get(balance.to.toString()) || 'Unknown',
    amountMinor: balance.amountMinor,
    currency: balance.currency,
  }));
}

module.exports = { recomputeGroupBalances, getGroupBalances };
