const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TEST_PROJECT_PATH = path.resolve(__dirname, '../dev-test-npm');
const rootPath = path.resolve(__dirname, '..');

function run(command, options = {}) {
  console.log(`Running: ${command}`);
  const result = spawnSync(command, { shell: true, stdio: 'inherit', ...options });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${command}`);
  }
}

try {
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

  // 4. Initialize package.json
  const packageJson = {
    name: 'decap-cms-integrity-test',
    version: '1.0.0',
    type: 'module',
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

  run(`npm install react@${reactVersion} react-dom@${reactDomVersion} "${tarballPath}"`, { cwd: TEST_PROJECT_PATH });

  // 7. Install Playwright for browser testing
  console.log('\n=== Installing Playwright ===');
  run('npm install playwright --save-dev', { cwd: TEST_PROJECT_PATH });
  run('npx playwright install chromium', { cwd: TEST_PROJECT_PATH });

  // 8. Create HTML test page
  const testHtmlPath = path.join(TEST_PROJECT_PATH, 'test.html');
  fs.writeFileSync(
    testHtmlPath,
    `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Decap CMS Smoke Test</title>
</head>
<body>
  <div id="nc-root"></div>
  <script type="module">
    // Test the standard import path that users would actually use
    import CMS from 'decap-cms-app';

    window.testResult = { success: false, error: null };

    try {
      console.log('CMS imported:', typeof CMS);
      console.log('CMS.init:', typeof CMS?.init);
      console.log('CMS.registerPreviewTemplate:', typeof CMS?.registerPreviewTemplate);

      // Test the exact API from the documentation example
      if (CMS && typeof CMS.init === 'function' && typeof CMS.registerPreviewTemplate === 'function') {
        // Initialize the CMS object (as per example)
        CMS.init();
        console.log('CMS.init() executed successfully');

        window.testResult.success = true;
        window.testResult.message = 'CMS API is available and init() works';
      } else {
        throw new Error('CMS API is incomplete - missing init() or registerPreviewTemplate()');
      }
    } catch (e) {
      window.testResult.error = e.message;
      console.error('Test failed:', e);
    }
  </script>
</body>
</html>
`
  );

  // 9. Create Playwright test script
  const testFilePath = path.join(TEST_PROJECT_PATH, 'smoke-test.js');
  fs.writeFileSync(
    testFilePath,
    `import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = createServer((req, res) => {
  let filePath;

  if (req.url === '/') {
    filePath = join(__dirname, 'test.html');
  } else if (req.url.startsWith('/node_modules/')) {
    filePath = join(__dirname, req.url);
  } else {
    filePath = join(__dirname, req.url.slice(1));
  }

  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json'
  };

  const ext = extname(filePath);
  const contentType = mimeTypes[ext] || 'text/plain';

  try {
    const content = readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    res.end(content);
  } catch (err) {
    res.writeHead(404);
    res.end('Not found: ' + req.url);
  }
});

server.listen(0, async () => {
  const port = server.address().port;
  console.log('Test server running on http://localhost:' + port);

  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();

    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      console.log('[Browser ' + type + ']:', text);
    });

    page.on('pageerror', error => {
      console.error('[Browser Error]:', error.message);
    });

    console.log('Loading test page...');
    await page.goto('http://localhost:' + port + '/test.html');

    console.log('Waiting for test to complete...');
    await page.waitForTimeout(3000);

    console.log('Evaluating test result...');
    const result = await page.evaluate(() => window.testResult);

    await browser.close();
    server.close();

    if (result && result.success) {
      console.log('');
      console.log('✓ Integrity check: decap-cms-app loaded successfully');
      console.log('✓', result.message);
      console.log('✓ Smoke test passed');
      console.log('');
      console.log('Package can be imported as: import CMS from "decap-cms-app"');
      process.exit(0);
    } else {
      console.error('');
      console.error('✗ Smoke test failed:', result?.error || 'Unknown error');
      process.exit(1);
    }
  } catch (error) {
    console.error('✗ Playwright error:', error.message);
    if (browser) await browser.close();
    server.close();
    process.exit(1);
  }
});
`
  );

  // 10. Run Playwright test
  console.log('\n=== Running smoke test in browser ===');
  run('node smoke-test.js', { cwd: TEST_PROJECT_PATH });

  console.log('\n✓ Integrity check completed successfully!');
  process.exit(0);
} catch (err) {
  console.error('\n✗ Integrity check failed:', err.message);
  process.exit(1);
}
