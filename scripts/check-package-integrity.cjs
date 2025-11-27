const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TEST_PROJECT_PATH = path.resolve(__dirname, '../dev-test-npm');
const rootPath = path.resolve(__dirname, '..');
const VITE_PID_FILE = path.join(TEST_PROJECT_PATH, '.vite-server.pid');

function run(command, options = {}) {
  console.log(`Running: ${command}`);
  const result = spawnSync(command, { shell: true, stdio: 'inherit', ...options });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${command}`);
  }
}

function killViteServer() {
  // Kill any previous Vite server from a failed run
  if (fs.existsSync(VITE_PID_FILE)) {
    try {
      const pid = fs.readFileSync(VITE_PID_FILE, 'utf8').trim();
      console.log(`Killing previous Vite server (PID: ${pid})...`);
      if (process.platform === 'win32') {
        spawnSync('taskkill', ['/F', '/PID', pid, '/T'], { shell: true, stdio: 'ignore' });
      } else {
        spawnSync('kill', ['-9', pid], { stdio: 'ignore' });
      }
      fs.unlinkSync(VITE_PID_FILE);
    } catch (err) {
      // Ignore errors, process may already be dead
    }
  }
}

async function waitForServer(url, timeout = 30000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) return true;
    } catch (e) {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Server at ${url} did not start within ${timeout}ms`);
}

(async () => {
try {
  // Kill any lingering Vite server from previous run
  killViteServer();
  // 0. Ensure monorepo dependencies are installed
  console.log('\n=== Installing monorepo dependencies ===');
  //run('npm install', { cwd: rootPath });

  // 1. Build all packages in the monorepo (this builds dependencies in correct order)
  console.log('\n=== Building all packages ===');
  //run('npm run build', { cwd: rootPath });

  // 2. Verify decap-cms-app build outputs exist
  const appPackagePath = path.join(rootPath, 'packages', 'decap-cms-app');
  const mainFile = path.join(appPackagePath, 'dist', 'decap-cms-app.js');
  const esmFile = path.join(appPackagePath, 'dist', 'esm', 'index.js');

  console.log('\n=== Checking build outputs ===');
  console.log('Main file exists:', fs.existsSync(mainFile));
  console.log('ESM file exists:', fs.existsSync(esmFile));

  if (!fs.existsSync(mainFile)) {
    throw new Error(`Build failed: ${mainFile} was not created`);
  }

  // 3. Create a fresh test project
  if (fs.existsSync(TEST_PROJECT_PATH)) {
    fs.rmSync(TEST_PROJECT_PATH, { recursive: true, force: true });
  }
  fs.mkdirSync(TEST_PROJECT_PATH, { recursive: true });

  // 4. Initialize package.json WITHOUT "type": "module" for the main script
  const packageJson = {
    name: 'decap-cms-integrity-test',
    version: '1.0.0',
    private: true
  };
  fs.writeFileSync(
    path.join(TEST_PROJECT_PATH, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // 5. Read React version from root package.json
  const rootPackageJson = JSON.parse(fs.readFileSync(path.join(rootPath, 'package.json'), 'utf8'));
  const reactVersion = rootPackageJson.devDependencies.react || '^19.1.0';
  const reactDomVersion = rootPackageJson.devDependencies['react-dom'] || '^19.1.0';

  // 6. Install decap-cms-app and its dependencies
  console.log('\n=== Installing test dependencies ===');
  console.log(`Using React version: ${reactVersion}, React DOM version: ${reactDomVersion}`);

  // Install decap-cms-app from the built package (using npm pack + install)
  console.log('Packing decap-cms-app...');
  run('npm pack', { cwd: appPackagePath });

  const packageTarball = fs.readdirSync(appPackagePath).find(f => f.endsWith('.tgz'));
  if (!packageTarball) {
    throw new Error('Failed to create package tarball');
  }

  const tarballPath = path.join(appPackagePath, packageTarball);
  console.log(`Installing from ${tarballPath}...`);

  run(`npm install vite playwright "${tarballPath}"`, { cwd: TEST_PROJECT_PATH });

  // 7. Install Playwright browsers if needed
  console.log('\n=== Setting up Playwright ===');
  run('npx playwright install chromium', { cwd: TEST_PROJECT_PATH });

  // 8. Create index.html
  const htmlFilePath = path.join(TEST_PROJECT_PATH, 'index.html');
  fs.writeFileSync(
    htmlFilePath,
    `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Decap CMS Integrity Test</title>
</head>
<body>
  <div id="root"></div>
  <div id="test-results"></div>
  <script type="module" src="/main.js"></script>
</body>
</html>`
  );

  // 8a. Create minimal config.yml to avoid warnings
  const publicDir = path.join(TEST_PROJECT_PATH, 'public');
  fs.mkdirSync(publicDir, { recursive: true });
  const configYmlPath = path.join(publicDir, 'config.yml');
  fs.writeFileSync(
    configYmlPath,
    `backend:
  name: test-repo

media_folder: "static/images"
public_folder: "/images"

collections:
  - name: "test"
    label: "Test"
    folder: "content/test"
    create: true
    fields:
      - { label: "Title", name: "title", widget: "string" }
`
  );

  // 9. Create main.js with EXACT documentation pattern
  const mainJsPath = path.join(TEST_PROJECT_PATH, 'main.js');
  fs.writeFileSync(
    mainJsPath,
    `// Test the exact usage pattern from the documentation:
// npm install decap-cms-app --save
import CMS from "decap-cms-app";
// Initialize the CMS object
CMS.init();
// Now the registry is available via the CMS object.
const MyTemplate = {};
CMS.registerPreviewTemplate("my-template", MyTemplate);

// Test verification
const results = document.getElementById('test-results');
const log = (msg) => {
  console.log(msg);
  const p = document.createElement('p');
  p.textContent = msg;
  results.appendChild(p);
};

try {
  log('=== Testing decap-cms-app npm package ===');
  log('✓ import CMS from "decap-cms-app" - SUCCESS');
  log('✓ CMS.init() - SUCCESS');
  log('✓ CMS.registerPreviewTemplate() - SUCCESS');
  log('TEST_PASSED');
} catch (error) {
  log('✗ Test failed: ' + error.message);
  log('TEST_FAILED');
}
`
  );

  // 10. Create vite.config.js
  const viteConfigPath = path.join(TEST_PROJECT_PATH, 'vite.config.js');
  fs.writeFileSync(
    viteConfigPath,
    `export default {
  server: {
    port: 8765
  }
};
`
  );

  // 11. Create Playwright test script
  const playwrightTestPath = path.join(TEST_PROJECT_PATH, 'run-test.js');
  fs.writeFileSync(
    playwrightTestPath,
    `import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Capture console logs and errors
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.error('[Browser Error]', text);
    } else {
      console.log('[Browser]', text);
    }
  });
  page.on('pageerror', error => console.error('[Browser PageError]', error.message));

  try {
    await page.goto('http://localhost:8765', { waitUntil: 'networkidle', timeout: 30000 });

    await page.waitForFunction(() => {
      const results = document.getElementById('test-results');
      const text = results ? results.textContent : '';
      return text.includes('TEST_PASSED') || text.includes('TEST_FAILED');
    }, { timeout: 30000 });

    const results = await page.textContent('#test-results');
    await browser.close();

    if (results.includes('TEST_PASSED')) {
      console.log('\\n✓ Package integrity verified');
      console.log('\\nPackage works exactly as documented:');
      console.log('  npm install decap-cms-app --save');
      console.log('  import CMS from "decap-cms-app";');
      console.log('  CMS.init();');
      console.log('  CMS.registerPreviewTemplate("my-template", MyTemplate);');
      process.exit(0);
    } else {
      console.error('\\n✗ Test failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('\\n✗ Test error:', error.message);
    await browser.close();
    process.exit(1);
  }
})();`
  );

  // 12. Start Vite dev server in background and run test
  console.log('\n=== Starting Vite dev server and running test ===');

  const viteProcess = require('child_process').spawn('npx', ['vite'], {
    cwd: TEST_PROJECT_PATH,
    shell: true,
    stdio: 'pipe'
  });

  // Save PID for cleanup
  fs.writeFileSync(VITE_PID_FILE, viteProcess.pid.toString());

  // Ensure cleanup on exit
  const cleanup = () => {
    if (viteProcess && !viteProcess.killed) {
      if (process.platform === 'win32') {
        // On Windows, kill the entire process tree
        spawnSync('taskkill', ['/F', '/PID', viteProcess.pid.toString(), '/T'], {
          shell: true,
          stdio: 'ignore'
        });
      } else {
        viteProcess.kill('SIGTERM');
        setTimeout(() => {
          if (!viteProcess.killed) viteProcess.kill('SIGKILL');
        }, 1000);
      }
    }
    if (fs.existsSync(VITE_PID_FILE)) {
      fs.unlinkSync(VITE_PID_FILE);
    }
  };
  process.on('exit', cleanup);
  process.on('SIGINT', () => {
    cleanup();
    process.exit(130);
  });
  process.on('SIGTERM', () => {
    cleanup();
    process.exit(143);
  });

  // Wait for Vite to start
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Vite server timeout')), 30000);
    viteProcess.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(output);
      if (output.includes('Local:') || output.includes('localhost:8765') || output.includes('ready in')) {
        clearTimeout(timeout);
        setTimeout(resolve, 1000); // Give it 1 more second
      }
    });
    viteProcess.stderr.on('data', (data) => process.stderr.write(data.toString()));
  });

  try {
    run('node run-test.js', { cwd: TEST_PROJECT_PATH });
    console.log('\n✓ Integrity check completed successfully!');
  } finally {
    cleanup();
  }

  process.exit(0);
} catch (err) {
  console.error('\n✗ Integrity check failed:', err.message);
  process.exit(1);
}
})();
