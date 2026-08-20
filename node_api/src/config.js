require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/node_api';
const JWT_SECRET = process.env.JWT_SECRET || 'development-only-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const DEFAULT_CURRENCY = (process.env.DEFAULT_CURRENCY || 'USD').toUpperCase();
const EXCHANGE_RATE_API_URL = process.env.EXCHANGE_RATE_API_URL || '';
const EXCHANGE_RATE_API_KEY = process.env.EXCHANGE_RATE_API_KEY || '';

module.exports = {
  MONGODB_URI,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  DEFAULT_CURRENCY,
  EXCHANGE_RATE_API_URL,
  EXCHANGE_RATE_API_KEY,
};
