#!/usr/bin/env node

/**
 * Packed install smoke test
 *
 * Packs every publishable workspace package with `pnpm pack` (never `npm pack`,
 * which leaves literal `catalog:` specifiers in the tarball) and installs the
 * entry packages from those tarballs into fresh projects with npm, yarn 4,
 * yarn 1 and pnpm. Every sibling is redirected to its tarball through the
 * client's override mechanism, so the exact-pinned sibling versions resolve
 * even before they are on the registry, and nothing is taken from the
 * workspace. Then, per client: `require.resolve` of the app and the Turbo
 * backend and `@decap/cli --version`; for npm also `npm ls --all` and a
 * webpack 5 build with the all-default config of
 * `import CMS from 'decap-cms-app'; CMS.init();`.
 *
 * Run `pnpm run build` first: this packs whatever `dist/` holds.
 *
 * Usage: node scripts/smoke-install-packed.mjs [--clients=npm,yarn4,yarn1,pnpm] [--keep]
 */

import { spawnSync } from 'child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

const ROOT_DIR = fileURLToPath(new URL('..', import.meta.url));
const ENTRY_PACKAGES = [
  'decap-cms-app',
  'decap-cms',
  'decap-cms-media-library-s3',
  '@decap/cli',
  'decap-server',
];
// The Turbo backends and the library they share, whichever exist in the tree.
const ENTRY_PATTERN = /^decap-cms-(backend|lib)-turbo(-|$)/;
const CLIENTS = ['npm', 'yarn4', 'yarn1', 'pnpm'];
const SMOKE_RESOLVE =
  "require.resolve('decap-cms-app'); require.resolve('decap-cms-backend-turbo-github')";
const OUTPUT_TAIL_LINES = 80;
// `npm ls --all` reports these as invalid for every published decap-cms-app,
// 3.16.3 included: react/react-dom 19 against old peer ranges (react-redux 7,
// @reduxjs/toolkit, react-scroll-sync, react-split-pane, ...) and slate 0.118
// against slate-base64-serializer's `<0.50.0`. Anything else fails the check.
const KNOWN_NPM_LS_INVALID = ['react', 'react-dom', 'slate'];

function log(msg) {
  console.log(`[smoke-install-packed] ${msg}`);
}

function parseArgs(argv) {
  const options = { clients: CLIENTS, keep: false };
  for (const arg of argv) {
    if (arg === '--keep') {
      options.keep = true;
    } else if (arg.startsWith('--clients=')) {
      options.clients = arg.slice('--clients='.length).split(',').filter(Boolean);
      const unknown = options.clients.filter(client => !CLIENTS.includes(client));
      if (unknown.length > 0) {
        throw new Error(`Unknown client(s): ${unknown.join(', ')}`);
      }
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

class StepError extends Error {}

/**
 * Runs a command through the shell (needed for npx/corepack shims on Windows),
 * printing only the tail of its output when it fails.
 */
function run(label, command, cwd, env = {}, { allowFailure = false } = {}) {
  const started = Date.now();
  const result = spawnSync(command, {
    cwd,
    shell: true,
    encoding: 'utf8',
    stdio: 'pipe',
    maxBuffer: 256 * 1024 * 1024,
    env: { ...process.env, ...env },
  });
  const seconds = ((Date.now() - started) / 1000).toFixed(1);

  if (result.status !== 0 && allowFailure) {
    return result;
  }

  if (result.status !== 0) {
    const output = `${result.stdout || ''}${result.stderr || ''}`.trimEnd().split('\n');
    console.error(`--- ${label}: \`${command}\` exited ${result.status} after ${seconds}s ---`);
    console.error(output.slice(-OUTPUT_TAIL_LINES).join('\n'));
    console.error(`--- end of ${label} output ---`);
    throw new StepError(`${label}: \`${command}\` exited ${result.status}`);
  }

  log(`  ok ${label} (${seconds}s)`);
  return result.stdout;
}

function getPublishablePackages() {
  const stdout = run('list workspace', 'pnpm -r ls --depth -1 --json', ROOT_DIR);
  return JSON.parse(stdout)
    .filter(pkg => pkg.name && !pkg.private)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function packAll(packages, destination) {
  mkdirSync(destination, { recursive: true });
  const tarballs = {};
  for (const pkg of packages) {
    const stdout = run(
      `pack ${pkg.name}`,
      `pnpm pack --pack-destination "${destination}" --json`,
      pkg.path,
    );
    // pnpm may print lifecycle output before the JSON document.
    const { filename } = JSON.parse(stdout.slice(stdout.indexOf('{')));
    tarballs[pkg.name] = `file:${filename}`;
  }
  return tarballs;
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function createProject(base, client, entries, tarballs) {
  const dir = join(base, client);
  mkdirSync(dir, { recursive: true });
  const dependencies = Object.fromEntries(entries.map(name => [name, tarballs[name]]));
  const manifest = { name: `decap-smoke-${client}`, version: '0.0.0', private: true, dependencies };

  if (client === 'npm') {
    manifest.overrides = tarballs;
  } else if (client === 'yarn4' || client === 'yarn1') {
    manifest.resolutions = tarballs;
  }
  writeJson(join(dir, 'package.json'), manifest);

  if (client === 'yarn4') {
    // An empty lockfile marks this directory as its own project root.
    writeFileSync(join(dir, 'yarn.lock'), '');
    writeFileSync(
      join(dir, '.yarnrc.yml'),
      'nodeLinker: node-modules\nenableTelemetry: false\nenableImmutableInstalls: false\n',
    );
  } else if (client === 'pnpm') {
    const overrides = Object.entries(tarballs)
      .map(([name, spec]) => `  ${JSON.stringify(name)}: ${JSON.stringify(spec)}`)
      .join('\n');
    writeFileSync(join(dir, 'pnpm-workspace.yaml'), `overrides:\n${overrides}\n`);
  }
  return dir;
}

function smoke(client, dir) {
  run(`${client} require.resolve`, `node -e "${SMOKE_RESOLVE}"`, dir);
  const version = run(
    `${client} @decap/cli --version`,
    'node node_modules/@decap/cli/dist/cli.cjs --version',
    dir,
  );
  log(`    @decap/cli --version: ${version.trim()}`);
}

function npmLs(dir) {
  const result = run('npm ls --all', 'npm ls --all', dir, {}, { allowFailure: true });
  if (typeof result === 'string') return;

  const problems = `${result.stdout}${result.stderr}`
    .split('\n')
    .map(line => line.match(/^npm error (invalid|missing|extraneous): (\S+)@\S+ (\S+)/))
    .filter(Boolean);
  const unexpected = problems.filter(
    ([, kind, name, path]) =>
      !(
        kind === 'invalid' &&
        KNOWN_NPM_LS_INVALID.includes(name) &&
        path.endsWith(`/node_modules/${name}`) &&
        !path.slice(0, -`/node_modules/${name}`.length).includes('/node_modules/')
      ),
  );

  if (problems.length === 0 || unexpected.length > 0) {
    console.error(
      `${result.stdout}${result.stderr}`.trimEnd().split('\n').slice(-OUTPUT_TAIL_LINES).join('\n'),
    );
    throw new StepError(
      `npm ls --all: exited ${result.status}` +
        (unexpected.length > 0 ? ` (${unexpected.map(([line]) => line).join('; ')})` : ''),
    );
  }
  log(
    `  ok npm ls --all (only the known peer-range mismatches: ${KNOWN_NPM_LS_INVALID.join(', ')})`,
  );
}

function webpackBuild(dir) {
  mkdirSync(join(dir, 'src'), { recursive: true });
  writeFileSync(join(dir, 'src', 'index.js'), "import CMS from 'decap-cms-app';\nCMS.init();\n");
  run('npm install webpack', 'npm install --no-audit --no-fund webpack@5 webpack-cli', dir);
  // No config file and no flags: what a consumer gets from `npx webpack`.
  run('npm webpack build', 'node node_modules/webpack-cli/bin/cli.js', dir);
}

const INSTALLERS = {
  npm(dir) {
    run('npm install', 'npm install --no-audit --no-fund', dir);
    npmLs(dir);
    smoke('npm', dir);
    webpackBuild(dir);
  },
  yarn4(dir) {
    run('yarn 4 install', 'corepack yarn@4 install --mode=skip-build', dir, {
      COREPACK_ENABLE_DOWNLOAD_PROMPT: '0',
      COREPACK_ENABLE_STRICT: '0',
    });
    smoke('yarn4', dir);
  },
  yarn1(dir) {
    // A private cache: yarn 1 caches file: tarballs by name and version, so a
    // shared cache can serve a previous run's tarball for the same version.
    run(
      'yarn 1 install',
      `npx --yes yarn@1 install --non-interactive --cache-folder "${join(dir, '.yarn-cache')}"`,
      dir,
    );
    smoke('yarn1', dir);
  },
  pnpm(dir) {
    run('pnpm install', 'pnpm install', dir);
    smoke('pnpm', dir);
  },
};

function main() {
  const { clients, keep } = parseArgs(process.argv.slice(2));
  const packages = getPublishablePackages();
  const names = new Set(packages.map(pkg => pkg.name));
  const missingEntries = ENTRY_PACKAGES.filter(name => !names.has(name));
  if (missingEntries.length > 0) {
    throw new Error(`Entry packages not in the workspace: ${missingEntries.join(', ')}`);
  }
  const direct = [
    ...ENTRY_PACKAGES,
    ...packages.map(pkg => pkg.name).filter(name => ENTRY_PATTERN.test(name)),
  ];
  // Workspace peers anywhere below the entries are installed directly from
  // their tarballs, as a site would. pnpm auto-installs a missing peer from the
  // registry and skips overrides, which fails for a version this release has
  // not published.
  const byName = new Map(packages.map(pkg => [pkg.name, pkg]));
  const reachable = new Set(direct);
  const peers = new Set();
  for (const name of reachable) {
    const manifest = JSON.parse(readFileSync(join(byName.get(name).path, 'package.json'), 'utf8'));
    const workspaceDeps = field => Object.keys(manifest[field] || {}).filter(dep => names.has(dep));
    workspaceDeps('peerDependencies').forEach(peer => peers.add(peer));
    ['dependencies', 'optionalDependencies', 'peerDependencies']
      .flatMap(workspaceDeps)
      .forEach(dep => reachable.add(dep));
  }
  const entries = [...new Set([...direct, ...peers])];

  const base = mkdtempSync(join(tmpdir(), 'decap-smoke-'));
  log(`Working in ${base}`);
  log(`Packing ${packages.length} publishable packages with pnpm pack`);
  const tarballs = packAll(packages, join(base, 'tarballs'));
  log(`Installing ${entries.join(', ')}`);

  const failures = [];
  for (const client of clients) {
    log(`[${client}]`);
    try {
      INSTALLERS[client](createProject(base, client, entries, tarballs));
    } catch (e) {
      if (!(e instanceof StepError)) throw e;
      failures.push(`${client}: ${e.message}`);
    }
  }

  if (keep || failures.length > 0) {
    log(`Kept ${base} for inspection`);
  } else {
    rmSync(base, { recursive: true, force: true });
  }

  if (failures.length > 0) {
    console.error('[smoke-install-packed] FAILED:');
    for (const failure of failures) {
      console.error(`[smoke-install-packed]   ${failure}`);
    }
    process.exit(1);
  }

  log(`All clients passed: ${clients.join(', ')}`);
}

try {
  main();
} catch (e) {
  console.error(`[smoke-install-packed] ERROR: ${e.message}`);
  process.exit(1);
}
