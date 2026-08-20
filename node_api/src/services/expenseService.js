const Expense = require('../models/Expense');
const { convertToBase, normalizeCurrency } = require('./currencyService');
const { recomputeGroupBalances } = require('./balanceService');

function idOf(value) {
  return value && value._id ? value._id.toString() : value.toString();
}

function assertMember(group, userId, label) {
  const found = group.members.some((member) => idOf(member.user) === userId.toString());
  if (!found) {
    const err = new Error(`${label} must be a group member`);
    err.status = 400;
    throw err;
  }
}

function equalShares(participantIds, total) {
  const base = Math.floor(total / participantIds.length);
  let remainder = total % participantIds.length;
  return participantIds.map((userId) => {
    const amountMinor = base + (remainder > 0 ? 1 : 0);
    remainder -= remainder > 0 ? 1 : 0;
    return { user: userId, amountMinor };
  });
}

async function createExpense(group, input) {
  const amountMinor = Number(input.amountMinor);
  if (!Number.isInteger(amountMinor) || amountMinor <= 0) {
    const err = new Error('amountMinor must be a positive integer');
    err.status = 400;
    throw err;
  }

  assertMember(group, input.paidBy, 'payer');
  const participantIds = (input.participants && input.participants.length > 0 ? input.participants : group.members.map((member) => idOf(member.user))).map(String);
  participantIds.forEach((participantId) => assertMember(group, participantId, 'participant'));

  const currency = normalizeCurrency(input.currency || group.baseCurrency);
  const { convertedAmountMinor, fxRate } = await convertToBase({
    amountMinor,
    currency,
    baseCurrency: group.baseCurrency,
    fxRate: input.fxRate,
  });

  let shares;
  if (input.splitType === 'custom') {
    shares = (input.shares || []).map((share) => ({ user: String(share.user), amountMinor: Number(share.amountMinor) }));
    shares.forEach((share) => assertMember(group, share.user, 'share user'));
    const sum = shares.reduce((acc, share) => acc + share.amountMinor, 0);
    if (shares.length === 0 || shares.some((share) => !Number.isInteger(share.amountMinor) || share.amountMinor < 0) || sum !== convertedAmountMinor) {
      const err = new Error('custom shares must be non-negative integers that sum to the converted total');
      err.status = 400;
      throw err;
    }
  } else {
    shares = equalShares(participantIds, convertedAmountMinor);
  }

  const expense = await Expense.create({
    group: group._id,
    description: String(input.description).trim(),
    paidBy: input.paidBy,
    participants: participantIds,
    splitType: input.splitType || 'equal',
    currency,
    amountMinor,
    baseCurrency: group.baseCurrency,
    fxRate,
    convertedAmountMinor,
    shares,
  });
  await recomputeGroupBalances(group);
  return expense;
}

module.exports = { createExpense };
