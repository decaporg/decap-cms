const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const { updateConfig } = require('../utils/config');
const { merge } = require('lodash');
const { getGitClient } = require('./common');

const initRepo = async dir => {
  await fs.remove(dir);
  await fs.mkdirp(dir);
  const git = getGitClient(dir);
  await git.init();
  await git.addConfig('user.email', 'cms-cypress-test@netlify.com');
  await git.addConfig('user.name', 'cms-cypress-test');

  const readme = 'README.md';
  await fs.writeFile(path.join(dir, readme), '');
  await git.add(readme);
  await git.commit('initial commit', readme, { '--no-verify': true, '--no-gpg-sign': true });
};

const startServer = async (repoDir, mode) => {
  const tsNode = path.join(__dirname, '..', '..', 'node_modules', '.bin', 'ts-node');
  const serverDir = path.join(__dirname, '..', '..', 'packages', 'netlify-cms-proxy-server');
  const distIndex = path.join(serverDir, 'dist', 'index.js');
  const tsIndex = path.join(serverDir, 'src', 'index.ts');

  const port = 8082;
  const env = {
    ...process.env,
    GIT_REPO_DIRECTORY: path.resolve(repoDir),
    PORT: port,
    MODE: mode,
  };

  console.log(`Starting proxy server on port '${port}' with mode ${mode}`);
  if (await fs.pathExists(distIndex)) {
    serverProcess = spawn('node', [distIndex], { env, cwd: serverDir });
  } else {
    serverProcess = spawn(tsNode, ['--files', tsIndex], { env, cwd: serverDir });
  }

  return new Promise((resolve, reject) => {
    serverProcess.stdout.on('data', data => {
      const message = data.toString().trim();
      console.log(`server:stdout: ${message}`);
      if (message.includes('Netlify CMS Proxy Server listening on port')) {
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
  const postfix = Math.random()
    .toString(32)
    .substring(2);

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
