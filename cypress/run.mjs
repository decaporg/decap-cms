import execa from 'execa';
import { globby } from 'globby';

async function runCypress() {
  const args = ['run', '--browser', 'chrome', '--headless'];

  const specs = await globby(['cypress/e2e/*spec*.js']);
  if (specs.length === 0) {
    console.log('No test files found in cypress/e2e/*spec*.js');
    process.exit(1);
  }

  const machineIndex = Number(process.env.MACHINE_INDEX || 0);
  const machineCount = Number(process.env.MACHINE_COUNT || 0);

  if (machineIndex && machineCount) {
    const specsPerMachine = Math.floor(specs.length / machineCount);
    const start = (machineIndex - 1) * specsPerMachine;
    const machineSpecs =
      machineIndex === machineCount
        ? specs.slice(start)
        : specs.slice(start, start + specsPerMachine);

    console.log(
      `Sharding specs manually: machine ${machineIndex}/${machineCount} running ${machineSpecs.length} specs`,
    );
    args.push('--spec', machineSpecs.join(','));
  } else {
    const ciBuildId =
      process.env.CI_BUILD_ID || process.env.GITHUB_RUN_ID || process.env.GITHUB_SHA;

    args.push(
      '--record',
      '--parallel',
      '--ci-build-id',
      ciBuildId,
      '--group',
      'GitHub CI',
      '--spec',
      specs.join(','),
    );
  }

  console.log('Running Cypress with args:', args.join(' '));
  await execa('cypress', args, {
    stdio: 'inherit',
    preferLocal: true,
    timeout: 60 * 60 * 1000, // 1 hour
  });
}

runCypress();
