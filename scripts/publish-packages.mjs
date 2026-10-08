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
// npm stages some uploads and checks them ("validating" on npmjs.com) before
// it serves them, then publishes them by itself. Until then the version reads
// as missing, so a re-run tries again and gets this 409. The upload is done:
// it is waiting on npm, not on us. Seen with decap-cms-app 3.17.0-beta.3, the
// largest tarball, on 2026-10-08.
const STAGED = /cannot publish over previously staged version/i;
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
 * Semver precedence for the versions this repo publishes (`1.2.3` and
 * `1.2.3-beta.4`), without depending on the `semver` package from a script
 * that runs before anything else is trusted. Negative when `a` sorts first.
 */
function compareVersions(a, b) {
  const [aCore, aPre] = a.split('-', 2);
  const [bCore, bPre] = b.split('-', 2);
  const aNums = aCore.split('.').map(Number);
  const bNums = bCore.split('.').map(Number);
  for (let i = 0; i < 3; i += 1) {
    if (aNums[i] !== bNums[i]) return aNums[i] - bNums[i];
  }
  // A release sorts after any of its prereleases.
  if (!aPre || !bPre) return (aPre ? -1 : 0) - (bPre ? -1 : 0);
  const aIds = aPre.split('.');
  const bIds = bPre.split('.');
  for (let i = 0; i < Math.max(aIds.length, bIds.length); i += 1) {
    if (aIds[i] === undefined) return -1;
    if (bIds[i] === undefined) return 1;
    const aNum = /^\d+$/.test(aIds[i]);
    const bNum = /^\d+$/.test(bIds[i]);
    if (aNum && bNum && Number(aIds[i]) !== Number(bIds[i]))
      return Number(aIds[i]) - Number(bIds[i]);
    if (aNum !== bNum) return aNum ? -1 : 1;
    if (aIds[i] !== bIds[i]) return aIds[i] < bIds[i] ? -1 : 1;
  }
  return 0;
}

function isPrerelease(version) {
  return version.includes('-');
}

/**
 * Keeps `latest` on the newest version of packages that have never had a
 * stable release, after a publish under another tag.
 *
 * npm gives a package `latest` on its first publish whatever `--tag` says, and
 * never moves it again for a `--tag beta` publish. For a package with only
 * betas (the `@decap/cli` CLI), plain `npx @decap/cli` and every MCP config
 * written as `npx -y @decap/cli mcp` would stay on the first beta forever. A package with any
 * stable version on the registry is never touched, so this cannot put a beta
 * in front of `decap-server` or `decap-cms` users.
 *
 * Runs over every package, not just this run's uploads, so a re-run heals a
 * move that failed, even when nothing is left to publish.
 */
async function promotePrereleaseOnlyLatest(packages, options) {
  if (options.tag === 'latest') return { failed: [] };

  const failed = [];
  for (const pkg of packages) {
    const doc = await fetchJson(`${options.registry}/${encodeName(pkg.name)}`);
    const latest = doc?.['dist-tags']?.latest;
    const versions = Object.keys(doc?.versions ?? {});
    // Any stable version at all, not just `latest`: a `latest` that points at
    // a beta by mistake (a tag push publishes under `latest`) must be fixed by
    // hand, not chased along every later beta.
    if (!latest || versions.some(version => !isPrerelease(version))) continue;
    if (!versions.includes(pkg.version) || compareVersions(pkg.version, latest) <= 0) continue;

    if (options.dryRun) {
      log(`  would move ${pkg.name} latest: ${latest} -> ${pkg.version} (no stable release yet)`);
      continue;
    }

    let moved = false;
    for (let attempt = 1; attempt <= PUBLISH_ATTEMPTS && !moved; attempt += 1) {
      const result = spawnSync(
        `npm dist-tag add ${pkg.name}@${pkg.version} latest --registry ${options.registry}`,
        { encoding: 'utf8', stdio: 'pipe', shell: true },
      );
      moved = result.status === 0;
      if (!moved && attempt < PUBLISH_ATTEMPTS) {
        // Usually registry lag: a version accepted moments ago is not yet
        // taggable.
        await delay(PUBLISH_RETRY_DELAY_MS);
      } else if (!moved) {
        process.stdout.write(`${result.stdout || ''}${result.stderr || ''}`);
      }
    }

    if (moved) {
      log(`  moved ${pkg.name} latest: ${latest} -> ${pkg.version} (no stable release yet)`);
    } else {
      failed.push(pkg);
    }
  }

  // A warning, not a failed release: the versions are published, only the tag
  // lags. In CI it always lands here: npm 11.19 answered `npm dist-tag add`
  // with E401 under trusted publishing on 2026-10-08, though npm's docs list
  // dist-tag as supported. A maintainer runs the commands with their own login.
  if (failed.length > 0) {
    log('\nWARNING: could not move `latest` for these packages, which have no stable release.');
    log('Run these with a maintainer login (each needs a one-time password):');
    for (const pkg of failed) {
      log(`  npm dist-tag add ${pkg.name}@${pkg.version} latest`);
    }
  }

  return { failed };
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

    if (STAGED.test(output)) {
      return { status: 'staged' };
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
    await promotePrereleaseOnlyLatest(packages, options);
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
  const staged = withStatus('staged');
  const failed = withStatus('failed');

  log('\n=== Summary ===');
  log(`published: ${published.length}`);
  log(`skipped:   ${packages.length - pending.length} (already on the registry)`);
  log(`bootstrap: ${needsBootstrap.length}`);
  log(`staged:    ${staged.length}`);
  log(`failed:    ${failed.length}`);

  if (staged.length > 0) {
    log('\nnpm is still validating these uploads ("validating" on npmjs.com). They go');
    log('public by themselves once it finishes; there is nothing to re-upload:');
    for (const pkg of staged) {
      log(`  ${pkg.name}@${pkg.version}`);
    }
  }

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

  await promotePrereleaseOnlyLatest(packages, options);

  if (needsBootstrap.length > 0 || failed.length > 0) {
    error('\nRe-running is safe: published versions are skipped, not re-uploaded.');
    process.exitCode = 1;
  }
}

main().catch(e => {
  error(e.message);
  process.exitCode = 1;
});
