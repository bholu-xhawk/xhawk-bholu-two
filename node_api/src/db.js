const mongoose = require('mongoose');
const { MONGODB_URI } = require('./config');

async function connectMongo() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  mongoose.set('strictQuery', true);
  await mongoose.connect(MONGODB_URI);
  return mongoose.connection;
}

module.exports = { connectMongo };
