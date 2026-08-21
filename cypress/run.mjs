import execa from 'execa';
import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function getSpecs() {
  const entries = await readdir(new URL('./e2e/', import.meta.url), { withFileTypes: true });
  return entries
    .filter(entry => entry.isFile() && entry.name.includes('spec') && entry.name.endsWith('.js'))
    .map(entry => `cypress/e2e/${entry.name}`)
    .sort();
}

export function getMachineSpecs(specs, machineIndex, machineCount) {
  if (
    !Number.isInteger(machineIndex) ||
    !Number.isInteger(machineCount) ||
    machineIndex < 1 ||
    machineIndex > machineCount
  ) {
    throw new Error(`Invalid E2E machine ${machineIndex}/${machineCount}`);
  }

  return specs.filter((_, index) => index % machineCount === machineIndex - 1);
}

export async function getCypressArgs(env = process.env) {
  const args = ['run', '--browser', 'electron', '--headless'];
  const machineIndex = Number(env.MACHINE_INDEX || 0);
  const machineCount = Number(env.MACHINE_COUNT || 0);

  if (env.CYPRESS_RECORD_KEY) {
    const isPR = env.GITHUB_EVENT_NAME === 'pull_request';
    const tags = ['ci'];
    if (isPR) tags.push('pr');
    if (env.GITHUB_BASE_REF) tags.push(`base:${env.GITHUB_BASE_REF}`);

    args.push('--record');
    if (machineIndex || machineCount) {
      getMachineSpecs([], machineIndex, machineCount);
      const ciBuildId = env.CI_BUILD_ID || env.GITHUB_RUN_ID || env.GITHUB_SHA;
      if (!ciBuildId) {
        throw new Error('CI_BUILD_ID is required for parallel Cypress runs');
      }
      args.push('--parallel', '--ci-build-id', ciBuildId);
    }
    args.push('--group', isPR ? 'PR Checks' : 'GitHub CI', '--tag', tags.join(','));
  } else if (machineIndex || machineCount) {
    const specs = getMachineSpecs(await getSpecs(), machineIndex, machineCount);
    if (specs.length === 0) {
      throw new Error(`No specs assigned to E2E machine ${machineIndex}/${machineCount}`);
    }
    console.log(`E2E machine ${machineIndex}/${machineCount} running ${specs.length} specs`);
    args.push('--spec', specs.join(','));
  }

  return args;
}

export async function runCypress() {
  const args = await getCypressArgs();
  console.log('Running Cypress with args:', args.join(' '));
  await execa('cypress', args, {
    stdio: 'inherit',
    preferLocal: true,
    timeout: 30 * 60 * 1000,
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCypress();
}
