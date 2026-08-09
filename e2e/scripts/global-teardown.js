const fs = require('node:fs');
const path = require('node:path');

const pidFile = path.resolve(__dirname, '..', '.mongo-memory.pid');

module.exports = async () => {
  if (!fs.existsSync(pidFile)) return;

  const [pidLine] = fs.readFileSync(pidFile, 'utf8').trim().split('\n');
  const pid = Number(pidLine);
  if (Number.isInteger(pid) && pid > 0) {
    try {
      process.kill(pid, 'SIGTERM');
    } catch (error) {
      if (error.code !== 'ESRCH') throw error;
    }
  }

  fs.unlinkSync(pidFile);
};
