const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

let isConnected = false;

async function connectDB(uri) {
  const mongoUri = uri || process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set');
  }
  if (isConnected) return mongoose.connection;
  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoUri, {
    // useNewUrlParser and useUnifiedTopology are default true in Mongoose 6+
  });
  isConnected = true;
  return mongoose.connection;
}

module.exports = { connectDB };
