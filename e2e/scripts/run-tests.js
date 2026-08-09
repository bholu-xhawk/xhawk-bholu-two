const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const e2eRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(e2eRoot, '..');
const depsRoot = path.join(e2eRoot, '.browser-deps');
const aptLists = path.join(depsRoot, 'apt-lists');
const aptArchives = path.join(depsRoot, 'apt-archives');
const extractRoot = path.join(depsRoot, 'root');
const libDir = path.join(extractRoot, 'usr', 'lib', 'x86_64-linux-gnu');
const fontConfigDir = path.join(extractRoot, 'etc', 'fonts');
const fontCacheDir = path.join(depsRoot, 'fontconfig-cache');

const aptPackages = [
  'libasound2t64',
  'libatk-bridge2.0-0t64',
  'libatk1.0-0t64',
  'libatspi2.0-0t64',
  'libcairo2',
  'libcups2t64',
  'libavahi-common3',
  'libavahi-client3',
  'libdbus-1-3',
  'libdrm2',
  'libgbm1',
  'libglib2.0-0t64',
  'libnspr4',
  'libnss3',
  'libpango-1.0-0',
  'libx11-6',
  'libxcb1',
  'libxcomposite1',
  'libxdamage1',
  'libxext6',
  'libxfixes3',
  'libxkbcommon0',
  'libxrandr2',
  'libfontconfig1',
  'libfreetype6',
  'libxrender1',
  'libxau6',
  'libxdmcp6',
  'libxi6',
  'libfribidi0',
  'libthai0',
  'libharfbuzz0b',
  'libpng16-16t64',
  'libxcb-render0',
  'libxcb-shm0',
  'libpixman-1-0',
  'libdatrie1',
  'libgraphite2-3',
  'fontconfig-config',
  'fonts-dejavu-core',
  'fonts-liberation',
];

function commandExists(command) {
  const result = spawnSync('sh', ['-c', `command -v ${command}`], { stdio: 'ignore' });
  return result.status === 0;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} exited with ${result.status}`);
  }
}

function collectFiles(dir, predicate, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) collectFiles(fullPath, predicate, files);
    else if (predicate(fullPath)) files.push(fullPath);
  }
  return files;
}

function findChromiumExecutable() {
  const cacheRoot = path.join(os.homedir(), '.cache', 'ms-playwright');
  const candidates = collectFiles(cacheRoot, (file) =>
    /chrome-headless-shell$/.test(file) || /chrome$/.test(file)
  );
  return candidates.find((file) => fs.existsSync(file));
}

function missingLibraries(chromiumPath, extraEnv = {}) {
  if (process.platform !== 'linux' || !chromiumPath || !commandExists('ldd')) return [];
  const result = spawnSync('ldd', [chromiumPath], {
    encoding: 'utf8',
    env: { ...process.env, ...extraEnv },
  });
  if (result.status !== 0) return [];
  return result.stdout
    .split('\n')
    .filter((line) => line.includes('not found'))
    .map((line) => line.trim());
}

function ensureDirectories() {
  for (const dir of [
    path.join(aptLists, 'partial'),
    path.join(aptArchives, 'partial'),
    extractRoot,
    fontCacheDir,
  ]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function provisionBrowserDependencies() {
  if (!commandExists('apt-get') || !commandExists('dpkg-deb')) {
    throw new Error(
      'Chromium is missing shared libraries and apt-get/dpkg-deb are unavailable. Run `npm run install:browsers --prefix e2e -- --with-deps` on a machine with package manager access.'
    );
  }

  ensureDirectories();
  run('apt-get', [
    `-o`,
    `Dir::State::Lists=${aptLists}`,
    `-o`,
    `Dir::Cache::Archives=${aptArchives}`,
    'update',
  ]);
  run('apt-get', [
    `-o`,
    `Dir::State::Lists=${aptLists}`,
    'download',
    ...aptPackages,
  ], { cwd: aptArchives });

  for (const deb of collectFiles(aptArchives, (file) => file.endsWith('.deb'))) {
    run('dpkg-deb', ['-x', deb, extractRoot]);
  }

  fs.mkdirSync(fontConfigDir, { recursive: true });
  fs.writeFileSync(
    path.join(fontConfigDir, 'local.conf'),
    `<?xml version="1.0"?>\n<!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">\n<fontconfig>\n  <dir>${path.join(extractRoot, 'usr', 'share', 'fonts')}</dir>\n  <cachedir>${fontCacheDir}</cachedir>\n</fontconfig>\n`
  );

  const homeFonts = path.join(os.homedir(), '.fonts');
  fs.mkdirSync(homeFonts, { recursive: true });
  for (const font of collectFiles(path.join(extractRoot, 'usr', 'share', 'fonts'), (file) => /\.(ttf|otf)$/i.test(file))) {
    fs.copyFileSync(font, path.join(homeFonts, path.basename(font)));
  }
}

function browserEnv(baseEnv = process.env) {
  const env = { ...baseEnv };
  if (fs.existsSync(libDir)) {
    env.LD_LIBRARY_PATH = [libDir, env.LD_LIBRARY_PATH].filter(Boolean).join(':');
  }
  if (fs.existsSync(fontConfigDir)) {
    env.FONTCONFIG_PATH = fontConfigDir;
  }
  return env;
}

function pythonCanImport(env) {
  const result = spawnSync(
    'python',
    ['-c', 'import fastapi, uvicorn; from pydantic_core import _pydantic_core'],
    { cwd: repoRoot, stdio: 'ignore', env }
  );
  return result.status === 0;
}

function pythonUserSite(env) {
  const result = spawnSync('python', ['-c', 'import site; print(site.getusersitepackages())'], {
    cwd: repoRoot,
    encoding: 'utf8',
    env,
  });
  if (result.status !== 0) return undefined;
  return result.stdout.trim();
}

function ensurePythonRuntime(env) {
  const cleanEnv = { ...env };
  delete cleanEnv.PYTHONPATH;
  delete cleanEnv.PYTHONHOME;

  if (pythonCanImport(cleanEnv)) return cleanEnv;

  console.warn('Python FastAPI dependencies are not importable for the active interpreter; installing matching user-site wheels.');
  run('python', ['-m', 'pip', 'install', '--user', '--ignore-installed', '-r', path.join(repoRoot, 'requirements.txt')], {
    cwd: repoRoot,
    env: cleanEnv,
  });

  const userSite = pythonUserSite(cleanEnv);
  const pythonEnv = { ...cleanEnv };
  if (userSite) {
    pythonEnv.PYTHONPATH = [userSite, pythonEnv.PYTHONPATH].filter(Boolean).join(':');
    pythonEnv.E2E_KEEP_PYTHON_ENV = '1';
  }

  if (!pythonCanImport(pythonEnv)) {
    throw new Error('Python FastAPI dependencies are still not importable after installing matching user-site wheels.');
  }
  return pythonEnv;
}

function ensureBrowserRuntime() {
  if (process.platform !== 'linux') return browserEnv();

  const chromiumPath = findChromiumExecutable();
  const missingBefore = missingLibraries(chromiumPath, browserEnv());
  if (missingBefore.length > 0) {
    console.warn('Chromium is missing Linux shared libraries; provisioning them under e2e/.browser-deps.');
    provisionBrowserDependencies();
  }

  const env = browserEnv();
  const missingAfter = missingLibraries(chromiumPath, env);
  if (missingAfter.length > 0) {
    throw new Error(`Chromium is still missing shared libraries:\n${missingAfter.join('\n')}`);
  }
  return env;
}

const env = ensurePythonRuntime(ensureBrowserRuntime());
const playwrightBin = path.join(
  e2eRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'playwright.cmd' : 'playwright'
);
const result = spawnSync(playwrightBin, ['test', ...process.argv.slice(2)], {
  cwd: e2eRoot,
  stdio: 'inherit',
  env,
  shell: process.platform === 'win32',
});

if (result.error) throw result.error;
process.exit(result.status || 0);
