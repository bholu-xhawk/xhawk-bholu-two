const fs = require('node:fs');
const path = require('node:path');
const { MongoMemoryServer } = require('mongodb-memory-server');

const port = Number(process.env.E2E_MONGO_PORT || 27017);
const host = process.env.E2E_MONGO_HOST || '127.0.0.1';
const dbName = 'node_api_e2e';
const pidFile = path.resolve(__dirname, '..', '.mongo-memory.pid');

let server;

async function shutdown() {
  if (server) {
    await server.stop();
    server = undefined;
  }
  if (fs.existsSync(pidFile)) fs.unlinkSync(pidFile);
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

(async () => {
  server = await MongoMemoryServer.create({
    instance: { ip: host, port, dbName },
    binary: { version: process.env.E2E_MONGOMS_VERSION || '7.0.14' },
  });

  fs.writeFileSync(pidFile, `${process.pid}\n${server.getUri()}\n`);
  setInterval(() => {}, 2147483647);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
