#!/usr/bin/env node

/**
 * GA graduation preflight
 *
 * `lerna version --conventional-graduate` strips the prerelease from every
 * package. If the stripped version was already published (or tagged) from
 * another line, lerna dies on the existing tag, and a forced run would make
 * the publish script skip the package as "already on the registry" while
 * dependents exact-pin the other line's code. This checks, for every
 * publishable name@version in the tree, that the graduated version is free on
 * the registry, in the local tags and in the remote's tags.
 *
 * Usage: node scripts/ga-preflight.mjs [--remote=origin] [--no-remote]
 */

import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT_DIR = fileURLToPath(new URL('..', import.meta.url));
const REGISTRY = 'https://registry.npmjs.org';

function run(command, args) {
  const result = spawnSync(command, args, { cwd: ROOT_DIR, encoding: 'utf8', stdio: 'pipe' });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed: ${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

function parseArgs(argv) {
  const options = { remote: 'origin' };
  for (const arg of argv) {
    if (arg === '--no-remote') {
      options.remote = null;
    } else if (arg.startsWith('--remote=')) {
      options.remote = arg.slice('--remote='.length);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

function getPublishablePackages() {
  return JSON.parse(run('pnpm', ['-r', 'ls', '--depth', '-1', '--json']))
    .filter(pkg => pkg.name && !pkg.private)
    .map(({ name, version }) => ({ name, version }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function getTags(remote) {
  const tags = new Set(run('git', ['tag', '--list']).split('\n').filter(Boolean));
  if (remote) {
    for (const line of run('git', ['ls-remote', '--tags', remote]).split('\n')) {
      const ref = line.split('\t')[1];
      if (ref) {
        tags.add(ref.replace(/^refs\/tags\//, '').replace(/\^\{\}$/, ''));
      }
    }
  }
  return tags;
}

async function registryStatus(name, version) {
  const url = `${REGISTRY}/${name.replaceAll('/', '%2f')}/${version}`;
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(url, { method: 'GET', headers: { accept: 'application/json' } });
      if (response.status < 500 && response.status !== 429) {
        return response.status;
      }
    } catch (e) {
      if (attempt === 3) {
        return `fetch failed: ${e.message}`;
      }
    }
    if (attempt === 3) {
      return 'registry kept failing';
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

async function main() {
  const { remote } = parseArgs(process.argv.slice(2));
  const packages = getPublishablePackages();
  const tags = getTags(remote);
  const offenders = [];

  await Promise.all(
    packages.map(async ({ name, version }) => {
      const graduated = version.split('-')[0];
      if (graduated === version) {
        offenders.push(`${name}@${version}: not a prerelease, graduation would not bump it`);
        return;
      }
      const status = await registryStatus(name, graduated);
      if (status !== 404) {
        offenders.push(`${name}@${version} -> ${graduated}: registry answered ${status}`);
      }
      if (tags.has(`${name}@${graduated}`)) {
        offenders.push(
          `${name}@${version} -> ${graduated}: tag ${name}@${graduated} exists${
            remote ? ` (local or ${remote})` : ''
          }`,
        );
      }
    }),
  );

  if (offenders.length > 0) {
    for (const offender of offenders.sort()) {
      console.error(offender);
    }
    process.exit(1);
  }

  console.log('preflight done');
}

main().catch(e => {
  console.error(e.message);
  process.exit(1);
});
