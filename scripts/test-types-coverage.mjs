#!/usr/bin/env node

/**
 * Type coverage test
 *
 * The root tsconfig builds the workspace through project references, so a
 * package that is not referenced is silently not type-checked and emits no
 * declarations. That is easy to miss when adding a package: nothing fails, the
 * package just quietly drops out of `tsc --build`.
 *
 * This asserts that every workspace package which publishes types is actually
 * wired into the build:
 *
 *   1. it declares `build:types`
 *   2. it has its own tsconfig.json
 *   3. the root tsconfig references it
 *   4. the root tsconfig maps its package name to its source
 *   5. it points `types` at the generated declarations
 *   6. it does not also ship a hand-written .d.ts that would shadow them
 *
 * @see https://github.com/decaporg/decap-cms/issues/7410
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const packagesDir = join(root, 'packages');

// Packages that are intentionally not part of the declaration build.
const EXCLUDED = new Set([
  'decap-cms', // bundle-only package, ships no types of its own
]);

function readJson(path) {
  // tsconfig.json allows comments; strip the ones we actually use.
  const raw = readFileSync(path, 'utf8').replace(/^\s*\/\/.*$/gm, '');
  return JSON.parse(raw);
}

const rootTsconfig = readJson(join(root, 'tsconfig.json'));
const referenced = new Set((rootTsconfig.references ?? []).map(r => r.path));
const mapped = rootTsconfig.compilerOptions?.paths ?? {};

const errors = [];

for (const name of readdirSync(packagesDir).sort()) {
  const dir = join(packagesDir, name);
  const pkgPath = join(dir, 'package.json');
  if (!existsSync(pkgPath) || EXCLUDED.has(name)) continue;

  const pkg = readJson(pkgPath);
  if (pkg.private) continue;

  const scripts = pkg.scripts ?? {};
  // Only packages that produce an esm build participate in declaration emit.
  if (!scripts['build:esm']) continue;

  if (!scripts['build:types']) {
    errors.push(`${name}: missing a "build:types" script`);
  }
  if (!existsSync(join(dir, 'tsconfig.json'))) {
    errors.push(`${name}: missing tsconfig.json`);
  }
  if (!referenced.has(`packages/${name}`)) {
    errors.push(`${name}: not listed in the root tsconfig "references"`);
  }
  if (!mapped[pkg.name]) {
    errors.push(`${name}: no "${pkg.name}" entry in the root tsconfig "paths"`);
  }
  if (pkg.types !== 'dist/esm/index.d.ts') {
    errors.push(`${name}: "types" is ${JSON.stringify(pkg.types)}, expected "dist/esm/index.d.ts"`);
  }
  // A hand-written index.d.ts next to package.json wins over `types` in some
  // resolvers and cannot be checked against the implementation.
  if (existsSync(join(dir, 'index.d.ts'))) {
    errors.push(`${name}: hand-written index.d.ts shadows the generated declarations`);
  }
}

if (errors.length) {
  console.error('Type coverage check failed:\n');
  for (const e of errors) console.error(`  - ${e}`);
  console.error(
    '\nEvery published package must be wired into the declaration build, otherwise\n' +
      'it is silently excluded from `tsc --build` and ships no types.\n',
  );
  process.exit(1);
}

console.log('Type coverage OK: every published package is wired into the declaration build.');
