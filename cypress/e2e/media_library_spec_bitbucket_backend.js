import fixture from './common/media_library';
import { entry1 } from './common/entries';
import * as specUtils from './common/spec_utils';

const backend = 'bitbucket';

describe('BitBucket Backend Media Library - REST API', () => {
  let taskResult = { data: {} };

  before(() => {
    specUtils.before(taskResult, {}, backend);
  });

  after(() => {
    specUtils.after(taskResult, backend);
  });

  beforeEach(() => {
    specUtils.beforeEach(taskResult, backend);
  });

  afterEach(() => {
    specUtils.afterEach(taskResult, backend);
  });

  fixture({ entries: [entry1], getUser: () => taskResult.data.user });
});
