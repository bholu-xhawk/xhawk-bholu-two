const mongoose = require('mongoose');
const { MONGODB_URI } = require('./config');

async function connectMongo() {
  // Use Mongoose recommended options implicitly in v7
  await mongoose.connect(MONGODB_URI);
  return mongoose.connection;
}

module.exports = { connectMongo };
