require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/node_api';
const DEFAULT_CORS_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const CORS_ORIGINS = (process.env.CORS_ORIGINS || DEFAULT_CORS_ORIGINS.join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

module.exports = { MONGODB_URI, CORS_ORIGINS };
