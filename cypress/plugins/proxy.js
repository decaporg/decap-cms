const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const { merge } = require('lodash');

const { updateConfig } = require('../utils/config');
const { getGitClient } = require('./common');

const initRepo = async dir => {
  await fs.remove(dir);
  await fs.mkdirp(dir);
  const git = getGitClient(dir);
  await git.init({ '--initial-branch': 'main' });
  await git.addConfig('user.email', 'cms-cypress-test@netlify.com');
  await git.addConfig('user.name', 'cms-cypress-test');

  const readme = 'README.md';
  await fs.writeFile(path.join(dir, readme), '');
  await git.add(readme);
  await git.commit('initial commit', readme, { '--no-verify': true, '--no-gpg-sign': true });
};

const startServer = async (repoDir, mode) => {
  // The proxy server is `decap dev` (packages/decap), formerly decap-server.
  // `pnpm run build:demo` builds it before the e2e run.
  const cliDir = path.join(__dirname, '..', '..', 'packages', 'decap');
  const cli = path.join(cliDir, 'dist', 'cli.cjs');
  if (!(await fs.pathExists(cli))) {
    throw new Error(`${cli} is missing. Build it with: pnpm --filter @decap/cli build`);
  }

  const port = 8082;
  const env = {
    ...process.env,
    GIT_REPO_DIRECTORY: path.resolve(repoDir),
    PORT: port,
    MODE: mode,
  };

  console.log(`Starting proxy server on port '${port}' with mode ${mode}`);
  serverProcess = spawn('node', [cli, 'dev'], { env, cwd: cliDir });

  return new Promise((resolve, reject) => {
    serverProcess.stdout.on('data', data => {
      const message = data.toString().trim();
      console.log(`server:stdout: ${message}`);
      if (message.includes('Decap CMS Proxy Server listening on port')) {
        resolve(serverProcess);
      }
    });

    serverProcess.stderr.on('data', data => {
      console.error(`server:stderr: ${data.toString().trim()}`);
      reject(data.toString());
    });
  });
};

let serverProcess;

async function setupProxy(options) {
  const postfix = Math.random().toString(32).slice(2);

  const testRepoName = `proxy-test-repo-${Date.now()}-${postfix}`;
  const tempDir = path.join('.temp', testRepoName);

  const { mode, ...rest } = options;

  await updateConfig(config => {
    merge(config, rest);
  });

  return { tempDir, mode };
}

async function teardownProxy(taskData) {
  if (serverProcess) {
    serverProcess.kill();
  }
  await fs.remove(taskData.tempDir);

  return null;
}

async function setupProxyTest(taskData) {
  await initRepo(taskData.tempDir);
  serverProcess = await startServer(taskData.tempDir, taskData.mode);
  return null;
}

async function teardownProxyTest(taskData) {
  if (serverProcess) {
    serverProcess.kill();
  }
  await fs.remove(taskData.tempDir);
  return null;
}

module.exports = {
  setupProxy,
  teardownProxy,
  setupProxyTest,
  teardownProxyTest,
};
