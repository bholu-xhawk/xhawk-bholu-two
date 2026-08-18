const http = require('http');

process.env.MONGOMS_VERSION = process.env.MONGOMS_VERSION || '7.0.14';

const { MongoMemoryServer } = require('mongodb-memory-server');

const port = Number(process.env.PORT || process.env.E2E_API_PORT || 3100);
let mongoServer;
let httpServer;

async function start() {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();

  const { connectMongo } = require('../../node_api/src/db');
  const app = require('../../node_api/src/app');

  await connectMongo();

  httpServer = http.createServer(app);
  await new Promise((resolve) => httpServer.listen(port, '127.0.0.1', resolve));
  console.log(`Book API E2E server listening on http://127.0.0.1:${port}`);
}

async function stop() {
  const mongoose = require('../../node_api/node_modules/mongoose');

  if (httpServer) {
    await new Promise((resolve) => httpServer.close(resolve));
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
}

process.on('SIGTERM', () => {
  stop().finally(() => process.exit(0));
});

process.on('SIGINT', () => {
  stop().finally(() => process.exit(0));
});

start().catch((err) => {
  console.error(err);
  stop().finally(() => process.exit(1));
});
