require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/node_api';
const XHAWK_BHOLU_API_BASE_URL = process.env.XHAWK_BHOLU_API_BASE_URL || 'http://localhost:3001';

module.exports = { MONGODB_URI, XHAWK_BHOLU_API_BASE_URL };
