#!/usr/bin/env node

/**
 * Resumable Package Publishing
 *
 * Publishes every publishable workspace package that is not already on the
 * registry at the version in the working tree, under an explicit dist-tag.
 *
 * `pnpm publish -r` on its own is not safely resumable, which is what made the
 * 3.17.0-beta.0 release take four runs:
 *
 *   - It aborts on the first error, so one unpublishable package strands every
 *     package behind it in the dependency order. A single new package that
 *     cannot authenticate blocked the other 43.
 *   - npm accepts a publish before the version is readable, so on a re-run the
 *     already-published packages answer "not published yet" to a version check
 *     and then fail the upload with 403 `cannot publish over the previously
 *     published versions`. Combined with the abort, every retry died on the
 *     first collision without reaching the packages that still needed
 *     publishing.
 *
 * So the set to publish is computed up front and the already-published are
 * never re-attempted; a failure isolates to its own package instead of
 * stranding the rest; and 403-already-published is read as success, because it
 * says the version is on the registry, which is the outcome being asked for.
 *
 * @see https://github.com/decaporg/decap-cms/issues/7979
 */

import { spawnSync } from 'child_process';

const DEFAULT_REGISTRY = 'https://registry.npmjs.org';
const DEFAULT_TAG = 'latest';
const PUBLISH_ATTEMPTS = 3;
const PUBLISH_RETRY_DELAY_MS = 30000;
const FETCH_ATTEMPTS = 3;
const FETCH_RETRY_DELAY_MS = 2000;

// npm reports an upload it has already accepted as a 403 rather than a
// conflict, and the message is the only way to tell it apart from a real
// permission failure.
const ALREADY_PUBLISHED = /cannot publish over the previously published versions/i;
// pnpm logs this and carries on unauthenticated when npm has no trusted
// publisher to exchange the OIDC token against.
const OIDC_EXCHANGE_FAILED = /ERR_PNPM_AUTH_TOKEN_EXCHANGE|Skipped OIDC/i;

function log(msg) {
  console.log(`[publish-packages] ${msg}`);
}

function error(msg) {
  console.error(`[publish-packages] ERROR: ${msg}`);
}

function parseArgs(argv) {
  const options = {
    registry: DEFAULT_REGISTRY,
    tag: DEFAULT_TAG,
    provenance: false,
    dryRun: false,
  };

  for (const arg of argv) {
    if (arg.startsWith('--tag=')) {
      options.tag = arg.slice('--tag='.length);
    } else if (arg.startsWith('--registry=')) {
      options.registry = arg.slice('--registry='.length);
    } else if (arg === '--provenance') {
      options.provenance = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!options.tag) {
    throw new Error('--tag must not be empty');
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

async function fetchJson(url) {
  for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { accept: 'application/json' } });
      if (response.status === 404) {
        return null;
      }
      if (response.ok) {
        return response.json();
      }
      if (attempt === FETCH_ATTEMPTS) {
        throw new Error(`registry responded ${response.status}`);
      }
    } catch (e) {
      if (attempt === FETCH_ATTEMPTS) {
        throw e;
      }
    }
    await delay(FETCH_RETRY_DELAY_MS);
  }
  throw new Error('exhausted registry retries');
}

// Scoped names must have their separator encoded to address a single version.
function encodeName(name) {
  return name.replaceAll('/', '%2f');
}

async function isVersionPublished(registry, name, version) {
  return (await fetchJson(`${registry}/${encodeName(name)}/${version}`)) !== null;
}

async function packageExists(registry, name) {
  return (await fetchJson(`${registry}/${encodeName(name)}`)) !== null;
}

/**
 * One `pnpm publish` over a filtered set. Returns the combined output so the
 * caller can tell an already-published collision from a real failure.
 */
function runPublish({ names, tag, provenance, dryRun }) {
  const filters = names.map(name => `--filter ${name}`).join(' ');
  const flags = [
    '--no-git-checks',
    '--report-summary',
    `--tag ${tag}`,
    provenance ? '--provenance' : '',
    dryRun ? '--dry-run' : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Invoked directly, never through `pnpm run <script> --`: pnpm injects a
  // literal `--` ahead of forwarded arguments, so they arrive as positionals
  // and are dropped without a word. That is how `--tag` was lost, publishing
  // prereleases to `latest`, and how `--provenance` silently stopped applying.
  const command = `pnpm publish ${filters} ${flags}`;
  const result = spawnSync(command, {
    encoding: 'utf8',
    stdio: 'pipe',
    shell: true,
  });

  const output = `${result.stdout || ''}${result.stderr || ''}`;
  process.stdout.write(output);

  return { ok: result.status === 0, output };
}

/**
 * Publish one package, reading a 403-already-published as success. Retries only
 * unclassified failures, which is where the intermittent OIDC exchange lives.
 */
async function publishOne(pkg, options) {
  for (let attempt = 1; attempt <= PUBLISH_ATTEMPTS; attempt += 1) {
    const { ok, output } = runPublish({ names: [pkg.name], ...options });

    if (ok) {
      return { status: 'published' };
    }

    if (ALREADY_PUBLISHED.test(output)) {
      return { status: 'already-published' };
    }

    if (OIDC_EXCHANGE_FAILED.test(output)) {
      const exists = await packageExists(options.registry, pkg.name);
      if (!exists) {
        return { status: 'needs-bootstrap' };
      }
    }

    if (attempt < PUBLISH_ATTEMPTS) {
      log(`  ${pkg.name} attempt ${attempt} failed, retrying in 30s...`);
      await delay(PUBLISH_RETRY_DELAY_MS);
    }
  }

  return { status: 'failed' };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const packages = getPublishablePackages();

  log(`${packages.length} publishable packages, dist-tag "${options.tag}"`);

  const pending = [];
  for (const pkg of packages) {
    if (await isVersionPublished(options.registry, pkg.name, pkg.version)) {
      log(`  ${pkg.name}@${pkg.version} already on the registry, skipping`);
    } else {
      pending.push(pkg);
    }
  }

  if (pending.length === 0) {
    log('\nNothing to publish: every version in the working tree is already on the registry.');
    return;
  }

  log(`\nPublishing ${pending.length} package(s)`);

  // The whole set in one call first, so pnpm orders it by dependency and a
  // clean release stays a single upload pass.
  const bulk = runPublish({ names: pending.map(pkg => pkg.name), ...options });

  const results = new Map();
  if (bulk.ok) {
    for (const pkg of pending) {
      results.set(pkg.name, 'published');
    }
  } else {
    // Something in the set failed, and pnpm stopped there — so the rest were
    // never attempted. Go package by package to find out which, and to give
    // every other package its turn.
    log('\nBulk publish did not complete; retrying package by package to isolate it');
    for (const pkg of pending) {
      if (await isVersionPublished(options.registry, pkg.name, pkg.version)) {
        results.set(pkg.name, 'published');
        continue;
      }
      const { status } = await publishOne(pkg, options);
      results.set(pkg.name, status);
    }
  }

  function withStatus(status) {
    return pending.filter(pkg => results.get(pkg.name) === status);
  }

  const published = [...withStatus('published'), ...withStatus('already-published')];
  const needsBootstrap = withStatus('needs-bootstrap');
  const failed = withStatus('failed');

  log('\n=== Summary ===');
  log(`published: ${published.length}`);
  log(`skipped:   ${packages.length - pending.length} (already on the registry)`);
  log(`bootstrap: ${needsBootstrap.length}`);
  log(`failed:    ${failed.length}`);

  if (needsBootstrap.length > 0) {
    error('\nThese packages have never been published, so npm has no trusted');
    error('publisher to exchange an OIDC token against and CI cannot create them.');
    error('Publish the first version from a maintainer machine, then configure');
    error('trusted publishing for each on npmjs.com:\n');
    error(
      `  pnpm publish ${needsBootstrap
        .map(pkg => `--filter ${pkg.name}`)
        .join(' ')} --no-git-checks --tag ${options.tag} --access public\n`,
    );
    error('Use pnpm, not `npm publish`, which ships literal `catalog:` specifiers.');
  }

  if (failed.length > 0) {
    error('\nThese packages failed to publish:');
    for (const pkg of failed) {
      error(`  ${pkg.name}@${pkg.version}`);
    }
  }

  if (needsBootstrap.length > 0 || failed.length > 0) {
    error('\nRe-running is safe: published versions are skipped, not re-uploaded.');
    process.exitCode = 1;
  }
}

main().catch(e => {
  error(e.message);
  process.exitCode = 1;
});
