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
  const isFork = process.env.IS_FORK === 'true';

  console.log(`IS_FORK: ${isFork}, MACHINE_INDEX: ${machineIndex}, MACHINE_COUNT: ${machineCount}`);

  if (isFork && machineIndex && machineCount) {
    const specsPerMachine = Math.floor(specs.length / machineCount);
    const start = (machineIndex - 1) * specsPerMachine;
    const machineSpecs =
      machineIndex === machineCount
        ? specs.slice(start)
        : specs.slice(start, start + specsPerMachine);

    console.log(
      `Sharding specs manually for fork: machine ${machineIndex}/${machineCount} running ${machineSpecs.length} specs`,
    );
    args.push('--spec', machineSpecs.join(','));
  } else {
    const ciBuildId =
      process.env.CI_BUILD_ID || process.env.GITHUB_RUN_ID || process.env.GITHUB_SHA;
    
    // Determine group name based on context
    const isPR = process.env.GITHUB_EVENT_NAME === 'pull_request';
    const groupName = isPR ? 'PR Checks' : 'GitHub CI';
    
    // Add tags for better organization in Cypress Cloud
    const tags = [];
    if (isPR) tags.push('pr');
    if (process.env.GITHUB_BASE_REF) tags.push(`base:${process.env.GITHUB_BASE_REF}`);
    
    args.push(
      '--record',
      '--parallel',
      '--ci-build-id',
      ciBuildId,
      '--group',
      groupName,
    );
    
    // Add tags if present
    if (tags.length > 0) {
      args.push('--tag', tags.join(','));
    }
  }

  console.log('Running Cypress with args:', args.join(' '));
  await execa('cypress', args, {
    stdio: 'inherit',
    preferLocal: true,
    timeout: 30 * 60 * 1000, // 30 minutes
  });
}

runCypress();
