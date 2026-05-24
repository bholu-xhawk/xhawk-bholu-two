require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/node_api';

module.exports = { MONGODB_URI };
