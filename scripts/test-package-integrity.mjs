#!/usr/bin/env node

/**
 * npm Package Integrity Test
 *
 * This script verifies that the built npm packages work correctly before publishing.
 * It tests:
 * 1. Package can be packed (npm pack)
 * 2. Package doesn't have Node.js-only dependencies that break browser bundlers
 * 3. Package.json has required fields
 *
 * @see https://github.com/decaporg/decap-cms/issues/7623
 */

import { spawnSync } from 'child_process';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const ROOT_DIR = process.cwd();
const PACKAGES_TO_TEST = ['decap-cms', 'decap-cms-core', 'decap-cms-app'];

// Known Node.js protocol imports that break browser bundlers
const BROWSER_INCOMPATIBLE_PATTERNS = [
  /from ['"]node:/,
  /require\(['"]node:/,
  /import ['"]node:/,
];

function log(msg) {
  console.log(`[test-package-integrity] ${msg}`);
}

function error(msg) {
  console.error(`[test-package-integrity] ERROR: ${msg}`);
}

/**
 * Recursively find all JS/MJS files in a directory
 */
function findJsFiles(dir, files = []) {
  if (!existsSync(dir)) return files;

  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      findJsFiles(fullPath, files);
    } else if (entry.endsWith('.js') || entry.endsWith('.mjs')) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Check if the dist files contain browser-incompatible imports
 */
function checkDistForNodeProtocol(packageDir) {
  const distDir = join(packageDir, 'dist');
  if (!existsSync(distDir)) {
    return { ok: true, issues: [] };
  }

  const issues = [];
  const jsFiles = findJsFiles(distDir);

  for (const filePath of jsFiles) {
    const content = readFileSync(filePath, 'utf8');
    for (const pattern of BROWSER_INCOMPATIBLE_PATTERNS) {
      if (pattern.test(content)) {
        issues.push({
          file: filePath.replace(ROOT_DIR, ''),
          pattern: pattern.toString(),
        });
      }
    }
  }

  return { ok: issues.length === 0, issues };
}

/**
 * Test that a package can be packed without errors
 */
function testPackagePack(packageName) {
  const packageDir = join(ROOT_DIR, 'packages', packageName);

  log(`Testing npm pack for ${packageName}...`);

  const result = spawnSync('npm', ['pack', '--dry-run'], {
    cwd: packageDir,
    encoding: 'utf8',
    stdio: 'pipe',
  });

  if (result.status !== 0) {
    error(`npm pack failed for ${packageName}`);
    error(result.stderr);
    return false;
  }

  log(`  npm pack OK for ${packageName}`);
  return true;
}

/**
 * Test that a package doesn't have browser-incompatible code
 */
function testBrowserCompatibility(packageName) {
  const packageDir = join(ROOT_DIR, 'packages', packageName);

  log(`Checking browser compatibility for ${packageName}...`);

  const { ok, issues } = checkDistForNodeProtocol(packageDir);

  if (!ok) {
    error(`Browser compatibility issues in ${packageName}:`);
    for (const issue of issues) {
      error(`  ${issue.file}: contains ${issue.pattern}`);
    }
    return false;
  }

  log(`  Browser compatibility OK for ${packageName}`);
  return true;
}

/**
 * Test that the package.json has required fields
 */
function testPackageJson(packageName) {
  const packageDir = join(ROOT_DIR, 'packages', packageName);
  const pkgJsonPath = join(packageDir, 'package.json');

  log(`Checking package.json for ${packageName}...`);

  const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
  const issues = [];

  // Check required fields
  const requiredFields = ['name', 'version', 'main', 'files'];
  for (const field of requiredFields) {
    if (!pkgJson[field]) {
      issues.push(`Missing required field: ${field}`);
    }
  }

  // Check that main entry exists
  if (pkgJson.main) {
    const mainPath = join(packageDir, pkgJson.main);
    if (!existsSync(mainPath)) {
      issues.push(`Main entry does not exist: ${pkgJson.main}`);
    }
  }

  // Check that module entry exists if specified
  if (pkgJson.module) {
    const modulePath = join(packageDir, pkgJson.module);
    if (!existsSync(modulePath)) {
      issues.push(`Module entry does not exist: ${pkgJson.module}`);
    }
  }

  if (issues.length > 0) {
    error(`package.json issues in ${packageName}:`);
    for (const issue of issues) {
      error(`  ${issue}`);
    }
    return false;
  }

  log(`  package.json OK for ${packageName}`);
  return true;
}

async function main() {
  log('Starting npm package integrity tests...');
  log(`Root directory: ${ROOT_DIR}`);

  let allPassed = true;

  for (const packageName of PACKAGES_TO_TEST) {
    log(`\n=== Testing ${packageName} ===`);

    const packOk = testPackagePack(packageName);
    const browserOk = testBrowserCompatibility(packageName);
    const pkgJsonOk = testPackageJson(packageName);

    if (!packOk || !browserOk || !pkgJsonOk) {
      allPassed = false;
    }
  }

  log('\n=== Summary ===');
  if (allPassed) {
    log('All package integrity tests passed!');
    process.exit(0);
  } else {
    error('Some package integrity tests failed!');
    process.exit(1);
  }
}

main().catch(e => {
  error(e.message);
  process.exit(1);
});
