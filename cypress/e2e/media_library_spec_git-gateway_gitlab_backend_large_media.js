import fixture from './common/media_library';
import { entry1 } from './common/entries';
import * as specUtils from './common/spec_utils';

const backend = 'git-gateway';
const provider = 'gitlab';

// TODO: Reevaluate these tests and re-enable them.
describe.skip('Git Gateway (GitLab) Backend Media Library - Large Media', () => {
  const taskResult = { data: {} };

  before(() => {
    console.log('[SPEC before] START');
    specUtils.before(taskResult, { publish_mode: 'editorial_workflow', provider }, backend);
    console.log('[SPEC before] COMPLETE, taskResult.data=', taskResult.data);
  });

  after(() => {
    console.log('[SPEC after] START');
    specUtils.after(taskResult, backend);
    console.log('[SPEC after] COMPLETE');
  });

  beforeEach(() => {
    console.log('[SPEC beforeEach] START, taskResult.data=', taskResult.data);
    specUtils.beforeEach(taskResult, backend);
    console.log('[SPEC beforeEach] COMPLETE');
  });

  afterEach(() => {
    console.log('[SPEC afterEach] START');
    specUtils.afterEach(taskResult, backend);
    console.log('[SPEC afterEach] COMPLETE');
  });

  console.log('[SPEC] About to call fixture()');
  fixture({ entries: [entry1], getUser: () => taskResult.data.user });
  console.log('[SPEC] fixture() returned');
});
