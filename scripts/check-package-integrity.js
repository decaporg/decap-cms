const { execSync, spawnSync } = require('child_process');
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
  run('npm install', { cwd: rootPath });

  // 1. Build all packages in the monorepo (this builds dependencies in correct order)
  console.log('\n=== Building all packages ===');
  run('npm run build', { cwd: rootPath });

  // 2. Force build decap-cms-app specifically (bypass nx cache)
  console.log('\n=== Force building decap-cms-app ===');
  const appPackagePath = path.join(rootPath, 'packages', 'decap-cms-app');
  run('npx nx reset', { cwd: rootPath }); // Clear nx cache
  run('npx nx run decap-cms-app:build --skip-nx-cache', { cwd: rootPath });

  // 3. Verify decap-cms-app build outputs exist
  const mainFile = path.join(appPackagePath, 'dist', 'decap-cms-app.js');
  const esmFile = path.join(appPackagePath, 'dist', 'esm', 'index.js');

  console.log('\n=== Checking build outputs ===');
  console.log('Main file exists:', fs.existsSync(mainFile));
  console.log('ESM file exists:', fs.existsSync(esmFile));

  if (!fs.existsSync(mainFile)) {
    throw new Error(`Build failed: ${mainFile} was not created`);
  }

  // 4. Create a fresh test project
  if (fs.existsSync(TEST_PROJECT_PATH)) {
    fs.rmSync(TEST_PROJECT_PATH, { recursive: true, force: true });
  }
  fs.mkdirSync(TEST_PROJECT_PATH, { recursive: true });

  // 5. Initialize package.json
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

  // 6. Install dependencies including Playwright
  console.log('\n=== Installing test dependencies ===');
  run('npm install react@^19.1.0 react-dom@^19.1.0 playwright --save-dev', { cwd: TEST_PROJECT_PATH });

  // 6.1. Install Playwright browsers
  console.log('\n=== Installing Playwright browsers ===');
  run('npx playwright install chromium', { cwd: TEST_PROJECT_PATH });

  // 7. Link decap-cms-app
  run('npm link', { cwd: appPackagePath });
  run('npm link decap-cms-app', { cwd: TEST_PROJECT_PATH });

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
        import CMS from './node_modules/decap-cms-app/dist/esm/index.js';

        window.testResult = { success: false, error: null };

        try {
          console.log('CMS loaded:', typeof CMS);
          console.log('CMS.init:', typeof CMS?.init);
          console.log('CMS.registerPreviewTemplate:', typeof CMS?.registerPreviewTemplate);

          if (CMS && typeof CMS.init === 'function' && typeof CMS.registerPreviewTemplate === 'function') {
            window.testResult.success = true;
            window.testResult.message = 'CMS API is available';
          } else {
            throw new Error('CMS API is incomplete');
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

  // 9. Create Playwright test
  const playwrightTestPath = path.join(TEST_PROJECT_PATH, 'smoke-test.mjs');
  fs.writeFileSync(
    playwrightTestPath,
    `import { chromium } from 'playwright';
    import { createServer } from 'http';
    import { readFileSync } from 'fs';
    import { join, extname } from 'path';
    import { fileURLToPath } from 'url';
    import { dirname } from 'path';

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    // Simple HTTP server to serve files
    const server = createServer((req, res) => {
      const filePath = join(__dirname, req.url === '/' ? 'test.html' : req.url.slice(1));

      const mimeTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.mjs': 'application/javascript'
      };

      const ext = extname(filePath);
      const contentType = mimeTypes[ext] || 'text/plain';

      try {
        const content = readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      } catch (err) {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.listen(0, async () => {
      const port = server.address().port;
      console.log(\`Test server running on http://localhost:\${port}\`);

      const browser = await chromium.launch();
      const page = await browser.newPage();

      // Listen for console messages
      page.on('console', msg => console.log('Browser:', msg.text()));

      // Load the test page
      await page.goto(\`http://localhost:\${port}/test.html\`);

      // Wait a bit for the module to load
      await page.waitForTimeout(2000);

      // Check test result
      const result = await page.evaluate(() => window.testResult);

      await browser.close();
      server.close();

      if (result && result.success) {
        console.log('✓ Integrity check: decap-cms-app loaded successfully');
        console.log('✓', result.message);
        console.log('✓ Smoke test passed');
        process.exit(0);
      } else {
        console.error('✗ Smoke test failed:', result?.error || 'Unknown error');
        console.error(result);
        process.exit(1);
      }
    });
    `
  );

  // 10. Run Playwright test
  console.log('\n=== Running smoke test in browser ===');
  run('node smoke-test.mjs', { cwd: TEST_PROJECT_PATH });

  console.log('\n✓ Integrity check completed successfully!');
  process.exit(0);
} catch (err) {
  console.error('\n✗ Integrity check failed:', err.message);
  process.exit(1);
}
