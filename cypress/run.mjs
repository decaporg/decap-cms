import execa from 'execa';

async function runCypress() {
  const args = ['run', '--browser', 'chrome', '--headless'];

  if (process.env.CYPRESS_RECORD_KEY) {
    const isPR = process.env.GITHUB_EVENT_NAME === 'pull_request';
    const tags = ['ci'];
    if (isPR) tags.push('pr');
    if (process.env.GITHUB_BASE_REF) tags.push(`base:${process.env.GITHUB_BASE_REF}`);

    args.push(
      '--record',
      '--group',
      isPR ? 'PR Checks' : 'GitHub CI',
      '--tag',
      tags.join(','),
    );
  }

  console.log('Running Cypress with args:', args.join(' '));
  await execa('cypress', args, {
    stdio: 'inherit',
    preferLocal: true,
    timeout: 30 * 60 * 1000, // 30 minutes for full suite on single machine
  });
}

runCypress();
