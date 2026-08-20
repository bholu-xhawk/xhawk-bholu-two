import { spawn } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { MongoMemoryServer } from 'mongodb-memory-server'

const supportDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(supportDir, '../../..')
const nodeApiEntry = path.join(repoRoot, 'node_api/src/index.js')
const port = process.env.PORT || '3010'

let mongoServer
let child
let stopping = false

async function stop(exitCode = 0) {
  if (stopping) return
  stopping = true

  if (child && !child.killed) {
    child.kill('SIGTERM')
    await Promise.race([
      once(child, 'exit'),
      new Promise((resolve) => setTimeout(resolve, 5_000)),
    ]).catch(() => {})
  }

  if (mongoServer) {
    await mongoServer.stop().catch((error) => {
      console.error('[node-api-e2e] Failed to stop MongoMemoryServer:', error)
      exitCode = exitCode || 1
    })
  }

  process.exit(exitCode)
}

async function start() {
  process.env.MONGOMS_VERSION ||= '7.0.14'
  process.env.MONGOMS_DISTRO ||= 'ubuntu-22.04'
  process.env.MONGOMS_USE_ARCHIVE_NAME_FOR_BINARY_NAME ||= 'true'

  mongoServer = await MongoMemoryServer.create()
  const mongoUri = mongoServer.getUri()

  child = spawn(process.execPath, [nodeApiEntry], {
    cwd: path.join(repoRoot, 'node_api'),
    env: {
      ...process.env,
      MONGODB_URI: mongoUri,
      PORT: port,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  child.stdout.on('data', (data) => process.stdout.write(`[node-api] ${data}`))
  child.stderr.on('data', (data) => process.stderr.write(`[node-api] ${data}`))
  child.on('exit', (code, signal) => {
    if (!stopping) {
      console.error(`[node-api-e2e] Node API exited unexpectedly with code ${code} signal ${signal}`)
      stop(code || 1)
    }
  })

  console.log(`[node-api-e2e] Started MongoMemoryServer for Node API on port ${port}`)
}

process.on('SIGINT', () => stop(130))
process.on('SIGTERM', () => stop(143))
process.on('uncaughtException', (error) => {
  console.error('[node-api-e2e] Uncaught exception:', error)
  stop(1)
})
process.on('unhandledRejection', (error) => {
  console.error('[node-api-e2e] Unhandled rejection:', error)
  stop(1)
})

start().catch((error) => {
  console.error('[node-api-e2e] Failed to start:', error)
  stop(1)
})
