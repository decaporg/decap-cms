#!/usr/bin/env node

/**
 * pnpm Package Integrity Test
 *
 * This script verifies that the built npm packages work correctly before publishing.
 * It tests:
 * 1. Package can be packed (pnpm pack)
 * 2. Package doesn't have Node.js-only dependencies that break browser bundlers
 * 3. Package.json has required fields
 *
 * @see https://github.com/decaporg/decap-cms/issues/7623
 */

import { spawnSync } from 'child_process';
import { readFileSync, existsSync, readdirSync, statSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { gunzipSync } from 'zlib';

const ROOT_DIR = process.cwd();
// The browser-bundle and package.json-shape checks only make sense for the
// browser entry points. The publish-protocol check runs over every publishable
// package -- scoping it to a hardcoded few is what let decap-server ship with
// unresolved `catalog:` specifiers (issue #7979).
const BROWSER_PACKAGES = ['decap-cms', 'decap-cms-core', 'decap-cms-app'];
const DEPENDENCY_FIELDS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
];

// Known Node.js protocol imports that break browser bundlers
const BROWSER_INCOMPATIBLE_PATTERNS = [/from ['"]node:/, /require\(['"]node:/, /import ['"]node:/];

function log(msg) {
  console.log(`[test-package-integrity] ${msg}`);
}

function error(msg) {
  console.error(`[test-package-integrity] ERROR: ${msg}`);
}

function readTarString(buffer, offset, length) {
  const end = buffer.indexOf(0, offset);
  const stringEnd = end === -1 || end > offset + length ? offset + length : end;
  return buffer.toString('utf8', offset, stringEnd);
}

function readFileFromTarball(tarballPath, targetPath) {
  const buffer = gunzipSync(readFileSync(tarballPath));

  for (let offset = 0; offset < buffer.length; ) {
    const name = readTarString(buffer, offset, 100);
    if (!name) {
      break;
    }

    const prefix = readTarString(buffer, offset + 345, 155);
    const path = prefix ? `${prefix}/${name}` : name;
    const size = parseInt(readTarString(buffer, offset + 124, 12).trim() || '0', 8);
    const contentOffset = offset + 512;

    if (path === targetPath) {
      return buffer.toString('utf8', contentOffset, contentOffset + size);
    }

    offset = contentOffset + Math.ceil(size / 512) * 512;
  }

  throw new Error(`Missing ${targetPath} in ${tarballPath}`);
}

/**
 * Every non-private package in the pnpm workspace, i.e. exactly the set that
 * `pnpm publish -r` uploads.
 */
function getPublishablePackages() {
  // Passed as a single string: spawnSync warns (DEP0190) when args are combined
  // with `shell: true`, and the shell is needed to resolve pnpm on Windows.
  const result = spawnSync('pnpm list -r --depth -1 --json', {
    encoding: 'utf8',
    stdio: 'pipe',
    shell: true,
  });

  if (result.status !== 0) {
    throw new Error(`pnpm list failed: ${result.stderr || result.stdout}`);
  }

  return JSON.parse(result.stdout)
    .filter(pkg => pkg.name && !pkg.private)
    .map(({ name, path }) => ({ name, dir: path }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function findPublishProtocolDependencies(manifest) {
  const dependenciesWithPublishProtocols = [];

  for (const field of DEPENDENCY_FIELDS) {
    const dependencies = manifest[field];
    if (!dependencies) {
      continue;
    }

    for (const [dependencyName, specifier] of Object.entries(dependencies)) {
      if (typeof specifier === 'string' && /^(catalog|workspace):/.test(specifier)) {
        dependenciesWithPublishProtocols.push(`${field}.${dependencyName}: ${specifier}`);
      }
    }
  }

  return dependenciesWithPublishProtocols;
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
function testPackagePack(packageName, packageDir) {
  log(`Testing pnpm pack for ${packageName}...`);

  const packDir = mkdtempSync(join(tmpdir(), `decap-pack-${packageName}-`));

  try {
    const result = spawnSync('pnpm', ['pack', '--json', '--pack-destination', packDir], {
      cwd: packageDir,
      encoding: 'utf8',
      stdio: 'pipe',
      shell: true,
    });

    if (result.status !== 0) {
      error(`pnpm pack failed for ${packageName}`);
      error(result.stderr || result.stdout);
      return false;
    }

    const packOutput = JSON.parse(result.stdout);
    const tarballPath = Array.isArray(packOutput) ? packOutput[0].filename : packOutput.filename;
    const packedPackageJson = JSON.parse(readFileFromTarball(tarballPath, 'package/package.json'));
    const publishProtocolDependencies = findPublishProtocolDependencies(packedPackageJson);
    if (publishProtocolDependencies.length > 0) {
      error(`pnpm pack left unresolved pnpm protocols in ${packageName}:`);
      for (const dependency of publishProtocolDependencies) {
        error(`  ${dependency}`);
      }
      return false;
    }

    log(`  pnpm pack OK for ${packageName}`);
    return true;
  } finally {
    rmSync(packDir, { recursive: true, force: true });
  }
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
  log('Starting pnpm package integrity tests...');
  log(`Root directory: ${ROOT_DIR}`);

  let allPassed = true;

  const publishablePackages = getPublishablePackages();
  log(`\n=== Checking packed manifests for ${publishablePackages.length} publishable packages ===`);

  for (const { name, dir } of publishablePackages) {
    if (!testPackagePack(name, dir)) {
      allPassed = false;
    }
  }

  for (const packageName of BROWSER_PACKAGES) {
    log(`\n=== Testing ${packageName} ===`);

    const browserOk = testBrowserCompatibility(packageName);
    const pkgJsonOk = testPackageJson(packageName);

    if (!browserOk || !pkgJsonOk) {
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
