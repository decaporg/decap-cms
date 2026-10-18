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
 * It also checks content and channel, which a clean manifest says nothing
 * about:
 * - Every package released at HEAD (its version differs from its previous
 *   tag, or it has none) must carry a provenance attestation whose gitCommit
 *   is `git rev-parse HEAD`. pnpm writes no `gitHead`, so the attestation is
 *   the only record of which commit a version was built from; a version
 *   published from another line under the same number fails here.
 *   `--allow-unattested=<name>[,<name>]` exempts packages bootstrapped by
 *   hand, which have no attestation.
 * - `--expect-tag=<tag>` requires `dist-tags[tag]` to equal the tree version
 *   for every package.
 *
 * @see https://github.com/decaporg/decap-cms/issues/7979
 */

import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT_DIR = fileURLToPath(new URL('..', import.meta.url));

const DEFAULT_REGISTRY = 'https://registry.npmjs.org';
const DEPENDENCY_FIELDS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
];
const PUBLISH_PROTOCOL = /^(catalog|workspace):/;
const SLSA_PROVENANCE = 'https://slsa.dev/provenance/v1';
const FETCH_ATTEMPTS = 3;
const FETCH_RETRY_DELAY_MS = 2000;
// npm accepts a publish before the version is readable, and the lag is per
// package: in the 3.x.2 release one package took ~4 minutes to appear. Without
// a settle window this gate reports a green publish as a failed release, and a
// gate that cries wolf gets ignored.
const PROPAGATION_SETTLE_MS = 10 * 60 * 1000;
const PROPAGATION_POLL_MS = 15000;

function log(msg) {
  console.log(`[verify-published-packages] ${msg}`);
}

function error(msg) {
  console.error(`[verify-published-packages] ERROR: ${msg}`);
}

function parseArgs(argv) {
  const options = {
    registry: DEFAULT_REGISTRY,
    allowMissing: false,
    expectTag: null,
    allowUnattested: new Set(),
  };

  for (const arg of argv) {
    if (arg === '--allow-missing') {
      options.allowMissing = true;
    } else if (arg.startsWith('--registry=')) {
      options.registry = arg.slice('--registry='.length);
    } else if (arg.startsWith('--expect-tag=')) {
      options.expectTag = arg.slice('--expect-tag='.length) || null;
    } else if (arg.startsWith('--allow-unattested=')) {
      for (const name of arg.slice('--allow-unattested='.length).split(',')) {
        if (name) options.allowUnattested.add(name);
      }
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
    cwd: ROOT_DIR,
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

function git(args) {
  const result = spawnSync('git', args, { cwd: ROOT_DIR, encoding: 'utf8', stdio: 'pipe' });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${result.stderr || result.stdout}`);
  }
  return result.stdout.trim();
}

/**
 * Whether HEAD released this package: true unless the newest `<name>@*` tag
 * on HEAD's history (excluding tags on HEAD itself) names the same version.
 * HEAD's own tags are excluded because the workflow verifies before the tags
 * are pushed, and a tag-push run has them on HEAD.
 */
function releasedAtHead(name, version) {
  const previous = git([
    'tag',
    '--list',
    `${name}@*`,
    '--merged',
    'HEAD',
    '--no-contains',
    'HEAD',
    '--sort=-creatordate',
  ]).split('\n')[0];
  return !previous || previous.slice(name.length + 1) !== version;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPublishedManifest(registry, name, version) {
  // Scoped names must have their separator encoded to address a single version,
  // e.g. `@scope/pkg` -> `@scope%2fpkg`. replaceAll, not replace: escaping only
  // the first occurrence is the js/incomplete-sanitization pattern.
  return fetchJson(`${registry}/${name.replaceAll('/', '%2f')}/${version}`, `${name}@${version}`);
}

async function fetchJson(url, label) {
  for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt++) {
    let response;
    try {
      response = await fetch(url, { headers: { accept: 'application/json' } });
    } catch (e) {
      if (attempt === FETCH_ATTEMPTS) {
        throw new Error(`${label}: ${e.message}`);
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
      throw new Error(`${label}: registry responded ${response.status}`);
    }

    await delay(FETCH_RETRY_DELAY_MS);
  }

  throw new Error(`${label}: exhausted registry retries`);
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

/**
 * The commit the registry's SLSA provenance says this version was built from,
 * or an issue string when there is none to read.
 */
async function provenanceCommit(manifest, label) {
  const url = manifest.dist && manifest.dist.attestations && manifest.dist.attestations.url;
  if (!url) {
    return { issue: 'no provenance attestation (published without --provenance or by hand)' };
  }

  const body = await fetchJson(url, `${label} attestations`);
  const provenance = ((body && body.attestations) || []).find(
    attestation => attestation.predicateType === SLSA_PROVENANCE,
  );
  if (!provenance) {
    return { issue: `attestations have no ${SLSA_PROVENANCE} entry` };
  }

  const statement = JSON.parse(
    Buffer.from(provenance.bundle.dsseEnvelope.payload, 'base64').toString('utf8'),
  );
  const dependencies =
    (statement.predicate.buildDefinition &&
      statement.predicate.buildDefinition.resolvedDependencies) ||
    [];
  const commit = dependencies.map(dep => dep.digest && dep.digest.gitCommit).find(Boolean);
  return commit ? { commit } : { issue: 'provenance names no gitCommit' };
}

async function checkPackage(registry, pkg, context) {
  const { name, version } = pkg;
  const label = `${name}@${version}`;
  let manifest;
  try {
    manifest = await fetchPublishedManifest(registry, name, version);
  } catch (e) {
    return { status: 'broken', issues: [e.message] };
  }

  if (!manifest) {
    return { status: 'missing', issues: [] };
  }

  const issues = findPublishProtocolDependencies(manifest);

  try {
    if (pkg.releasedAtHead && !context.allowUnattested.has(name)) {
      const { commit, issue } = await provenanceCommit(manifest, label);
      if (issue) {
        issues.push(`provenance: ${issue}`);
      } else if (commit !== context.head) {
        issues.push(`provenance: built from ${commit}, expected HEAD ${context.head}`);
      }
    }

    if (context.expectTag) {
      const tags = await fetchJson(
        `${registry}/-/package/${name.replaceAll('/', '%2f')}/dist-tags`,
        `${name} dist-tags`,
      );
      const tagged = tags && tags[context.expectTag];
      if (tagged !== version) {
        issues.push(`dist-tags.${context.expectTag} is ${tagged || 'unset'}, expected ${version}`);
      }
    }
  } catch (e) {
    issues.push(e.message);
  }

  return issues.length > 0 ? { status: 'broken', issues } : { status: 'ok', issues: [] };
}

/**
 * Re-check packages the registry has not caught up on yet, until they appear or
 * the settle window expires. Only absent versions are retried: an unresolved
 * specifier is a fact about the published manifest and will never fix itself.
 */
async function waitForPropagation(registry, pending, context) {
  const deadline = Date.now() + PROPAGATION_SETTLE_MS;
  let remaining = pending;
  const broken = [];

  while (remaining.length > 0 && Date.now() < deadline) {
    const waitSeconds = Math.round(PROPAGATION_POLL_MS / 1000);
    log(`  ${remaining.length} not visible yet, re-checking in ${waitSeconds}s...`);
    await delay(PROPAGATION_POLL_MS);

    const stillMissing = [];
    for (const pkg of remaining) {
      const { status, issues } = await checkPackage(registry, pkg, context);
      if (status === 'ok') {
        log(`  ${pkg.name}@${pkg.version} OK (appeared after propagation)`);
      } else if (status === 'broken') {
        broken.push({ ...pkg, issues });
      } else {
        stillMissing.push(pkg);
      }
    }
    remaining = stillMissing;
  }

  return { missing: remaining, broken };
}

async function main() {
  const { registry, allowMissing, expectTag, allowUnattested } = parseArgs(process.argv.slice(2));
  const head = git(['rev-parse', 'HEAD']);
  const packages = getPublishablePackages().map(pkg => ({
    ...pkg,
    releasedAtHead: releasedAtHead(pkg.name, pkg.version),
  }));
  const context = { head, expectTag, allowUnattested };

  log(`Verifying ${packages.length} publishable packages against ${registry}`);
  log(
    `Provenance must name ${head} for the ${
      packages.filter(p => p.releasedAtHead).length
    } released at HEAD` + (expectTag ? `; dist-tags.${expectTag} must equal the tree version` : ''),
  );

  const broken = [];
  let missing = [];

  for (const pkg of packages) {
    const { name, version } = pkg;
    const { status, issues } = await checkPackage(registry, pkg, context);

    if (status === 'broken') {
      broken.push({ name, version, issues });
      error(`${name}@${version} failed verification:`);
      for (const issue of issues) {
        error(`  ${issue}`);
      }
    } else if (status === 'missing') {
      missing.push({ name, version });
      log(`  ${name}@${version} is not on the registry yet`);
    } else {
      log(`  ${name}@${version} OK`);
    }
  }

  // Absent versions may simply not have propagated yet, so give the registry
  // time to catch up before calling the release broken.
  if (missing.length > 0 && !allowMissing) {
    log(`\nWaiting up to ${PROPAGATION_SETTLE_MS / 60000} minutes for the registry to catch up`);
    const settled = await waitForPropagation(registry, missing, context);
    missing = settled.missing;
    broken.push(...settled.broken);
  }

  log('\n=== Summary ===');
  log(`verified: ${packages.length - broken.length - missing.length}`);
  log(`missing:  ${missing.length}`);
  log(`broken:   ${broken.length}`);

  if (broken.length > 0) {
    error('\nThese versions failed verification:');
    for (const { name, version, issues } of broken) {
      error(`  ${name}@${version}: ${issues.join('; ')}`);
    }
    error(
      'An unresolved catalog:/workspace: specifier is unusable with npm, yarn and bun and must be republished;',
    );
    error(
      'a provenance mismatch means the registry holds another commit under this version; a dist-tag mismatch is fixed with npm dist-tag add.',
    );
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
