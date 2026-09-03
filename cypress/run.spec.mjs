import assert from 'node:assert/strict';
import test from 'node:test';

import { getCypressArgs, getMachineSpecs, getSpecs } from './run.mjs';

test('manual shards contain every E2E spec exactly once', async () => {
  const specs = await getSpecs();
  const shards = [1, 2, 3, 4].map(index => getMachineSpecs(specs, index, 4));

  assert.ok(specs.length > 0);
  assert.deepEqual(shards.flat().sort(), specs);
  assert.equal(new Set(shards.flat()).size, specs.length);
  assert.ok(
    Math.max(...shards.map(shard => shard.length)) -
      Math.min(...shards.map(shard => shard.length)) <=
      1,
  );
});

test('recorded matrix runs use Cypress Cloud parallelization', async () => {
  const args = await getCypressArgs({
    CYPRESS_RECORD_KEY: 'record-key',
    CI_BUILD_ID: 'build-1',
    MACHINE_INDEX: '2',
    MACHINE_COUNT: '4',
    GITHUB_EVENT_NAME: 'pull_request',
    GITHUB_BASE_REF: 'main',
  });

  assert.deepEqual(args, [
    'run',
    '--browser',
    'electron',
    '--headless',
    '--record',
    '--parallel',
    '--ci-build-id',
    'build-1',
    '--group',
    'PR Checks',
    '--tag',
    'ci,pr,base:main',
  ]);
});

test('secretless matrix runs receive only their assigned specs', async () => {
  const specs = await getSpecs();
  const args = await getCypressArgs({ MACHINE_INDEX: '3', MACHINE_COUNT: '4' });

  assert.deepEqual(args.slice(0, 6), [
    'run',
    '--browser',
    'electron',
    '--headless',
    '--spec',
    getMachineSpecs(specs, 3, 4).join(','),
  ]);
});

test('local runs continue to execute the full suite without recording', async () => {
  await assert.doesNotReject(() => getCypressArgs({}));
  assert.deepEqual(await getCypressArgs({}), ['run', '--browser', 'electron', '--headless']);
});
