const ExchangeRate = require('../models/ExchangeRate');

function normalizeCurrency(currency) {
  return String(currency || '').trim().toUpperCase();
}

async function convertToBase({ amountMinor, currency, baseCurrency, fxRate }) {
  const fromCurrency = normalizeCurrency(currency);
  const toCurrency = normalizeCurrency(baseCurrency);
  if (fromCurrency === toCurrency) {
    return { convertedAmountMinor: amountMinor, fxRate: 1 };
  }

  let rate = Number(fxRate);
  if (!Number.isFinite(rate) || rate <= 0) {
    const storedRate = await ExchangeRate.findOne({ fromCurrency, toCurrency }).sort({ effectiveAt: -1 });
    if (!storedRate) {
      const err = new Error('fxRate is required for cross-currency expenses');
      err.status = 400;
      throw err;
    }
    rate = storedRate.rate;
  }

  return { convertedAmountMinor: Math.round(amountMinor * rate), fxRate: rate };
}

module.exports = { normalizeCurrency, convertToBase };
