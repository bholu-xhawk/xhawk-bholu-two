const net = require('node:net');
const fs = require('node:fs');
const { spawn, spawnSync } = require('node:child_process');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const mongoHost = process.env.E2E_MONGO_HOST || '127.0.0.1';
const mongoPort = Number(process.env.E2E_MONGO_PORT || 27017);
const useExistingMongo = process.env.E2E_USE_EXISTING_MONGO === '1';
const pidFile = path.resolve(__dirname, '..', '.mongo-memory.pid');

function canConnect(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    socket.once('connect', () => {
      socket.end();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
    socket.setTimeout(1000, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function waitForTcp(host, port, timeoutMs = 30000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await canConnect(host, port)) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for MongoDB at ${host}:${port}`);
}

function runCompose(command) {
  const result = spawnSync(command, ['compose', 'up', '-d', 'mongo'], {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.error && result.error.code === 'ENOENT') return false;
  if (result.status === 0) return true;
  return false;
}

function runComposeFallback() {
  const result = spawnSync('docker-compose', ['up', '-d', 'mongo'], {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.error && result.error.code === 'ENOENT') return false;
  return result.status === 0;
}

function startMemoryMongo() {
  if (fs.existsSync(pidFile)) fs.unlinkSync(pidFile);

  const child = spawn(process.execPath, [path.resolve(__dirname, 'memory-mongo.js')], {
    cwd: repoRoot,
    detached: true,
    env: process.env,
    stdio: 'ignore',
  });
  child.unref();
}

module.exports = async () => {
  if (!useExistingMongo) {
    const started = runCompose('docker') || runComposeFallback();
    if (!started) {
      console.warn('Docker Compose is unavailable; starting an isolated MongoDB binary for E2E tests.');
      startMemoryMongo();
    }
  }

  await waitForTcp(mongoHost, mongoPort);
};
