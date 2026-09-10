#!/usr/bin/env node

/**
 * Published Package Verification
 *
 * Fetches every publishable workspace package from the npm registry at the
 * version currently in the working tree, and fails if a published manifest
 * still carries pnpm-internal `catalog:` / `workspace:` specifiers.
 *
 * This runs *after* publishing on purpose. A pre-publish check can only
 * inspect what the correct publish client produces, so it cannot catch a
 * release that was uploaded by a client which does not understand
 * `catalog:` (`lerna publish`, `npm publish`). Only the registry knows what
 * was actually shipped.
 *
 * @see https://github.com/decaporg/decap-cms/issues/7979
 */

import { spawnSync } from 'child_process';

const DEFAULT_REGISTRY = 'https://registry.npmjs.org';
const DEPENDENCY_FIELDS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
];
const PUBLISH_PROTOCOL = /^(catalog|workspace):/;
const FETCH_ATTEMPTS = 3;
const FETCH_RETRY_DELAY_MS = 2000;

function log(msg) {
  console.log(`[verify-published-packages] ${msg}`);
}

function error(msg) {
  console.error(`[verify-published-packages] ERROR: ${msg}`);
}

function parseArgs(argv) {
  const options = { registry: DEFAULT_REGISTRY, allowMissing: false };

  for (const arg of argv) {
    if (arg === '--allow-missing') {
      options.allowMissing = true;
    } else if (arg.startsWith('--registry=')) {
      options.registry = arg.slice('--registry='.length);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return { ...options, registry: options.registry.replace(/\/+$/, '') };
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
    .map(({ name, version }) => ({ name, version }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPublishedManifest(registry, name, version) {
  // Scoped names must have their separator encoded to address a single version,
  // e.g. `@scope/pkg` -> `@scope%2fpkg`. replaceAll, not replace: escaping only
  // the first occurrence is the js/incomplete-sanitization pattern.
  const url = `${registry}/${name.replaceAll('/', '%2f')}/${version}`;

  for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt++) {
    let response;
    try {
      response = await fetch(url, { headers: { accept: 'application/json' } });
    } catch (e) {
      if (attempt === FETCH_ATTEMPTS) {
        throw new Error(`${name}@${version}: ${e.message}`);
      }
      await delay(FETCH_RETRY_DELAY_MS);
      continue;
    }

    if (response.status === 404) {
      return null;
    }

    if (response.ok) {
      return response.json();
    }

    // 5xx and rate limits are worth another try; anything else is not.
    if (attempt === FETCH_ATTEMPTS || (response.status < 500 && response.status !== 429)) {
      throw new Error(`${name}@${version}: registry responded ${response.status}`);
    }

    await delay(FETCH_RETRY_DELAY_MS);
  }

  throw new Error(`${name}@${version}: exhausted registry retries`);
}

function findPublishProtocolDependencies(manifest) {
  const dependenciesWithPublishProtocols = [];

  for (const field of DEPENDENCY_FIELDS) {
    for (const [dependencyName, specifier] of Object.entries(manifest[field] || {})) {
      if (typeof specifier === 'string' && PUBLISH_PROTOCOL.test(specifier)) {
        dependenciesWithPublishProtocols.push(`${field}.${dependencyName}: ${specifier}`);
      }
    }
  }

  return dependenciesWithPublishProtocols;
}

async function main() {
  const { registry, allowMissing } = parseArgs(process.argv.slice(2));
  const packages = getPublishablePackages();

  log(`Verifying ${packages.length} publishable packages against ${registry}`);

  const broken = [];
  const missing = [];

  for (const { name, version } of packages) {
    let manifest;
    try {
      manifest = await fetchPublishedManifest(registry, name, version);
    } catch (e) {
      error(e.message);
      broken.push({ name, version, issues: [e.message] });
      continue;
    }

    if (!manifest) {
      missing.push({ name, version });
      log(`  ${name}@${version} is not on the registry`);
      continue;
    }

    const issues = findPublishProtocolDependencies(manifest);
    if (issues.length > 0) {
      broken.push({ name, version, issues });
      error(`${name}@${version} published with unresolved pnpm protocols:`);
      for (const issue of issues) {
        error(`  ${issue}`);
      }
      continue;
    }

    log(`  ${name}@${version} OK`);
  }

  log('\n=== Summary ===');
  log(`verified: ${packages.length - broken.length - missing.length}`);
  log(`missing:  ${missing.length}`);
  log(`broken:   ${broken.length}`);

  if (broken.length > 0) {
    error('\nThese versions are unusable with npm, yarn and bun and must be republished:');
    for (const { name, version } of broken) {
      error(`  ${name}@${version}`);
    }
    process.exit(1);
  }

  if (missing.length > 0 && !allowMissing) {
    error('\nThese versions never reached the registry:');
    for (const { name, version } of missing) {
      error(`  ${name}@${version}`);
    }
    error('Re-run the publish workflow, or pass --allow-missing when checking before a release.');
    process.exit(1);
  }

  log('All published manifests are clean!');
}

main().catch(e => {
  error(e.message);
  process.exit(1);
});
