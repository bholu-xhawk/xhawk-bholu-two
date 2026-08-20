const { Schema, model } = require('mongoose');

const ExchangeRateSchema = new Schema(
  {
    fromCurrency: { type: String, required: true, uppercase: true },
    toCurrency: { type: String, required: true, uppercase: true },
    rate: { type: Number, required: true, min: 0 },
    source: { type: String, default: 'manual' },
    effectiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ExchangeRateSchema.index({ fromCurrency: 1, toCurrency: 1, effectiveAt: -1 });

module.exports = model('ExchangeRate', ExchangeRateSchema);
