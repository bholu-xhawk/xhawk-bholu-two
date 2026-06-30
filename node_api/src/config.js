require('dotenv').config();
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/node_api';
const UPLOAD_DIR = process.env.UPLOAD_DIR ? path.resolve(process.cwd(), process.env.UPLOAD_DIR) : path.resolve(__dirname, '../uploads');

module.exports = { MONGODB_URI, UPLOAD_DIR };

