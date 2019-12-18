import fixture from './media/media_library';
import { entry1 } from './github/entries';
import * as specUtils from './github/spec_utils';

const backend = 'git-gateway';

describe('Git Gateway Backend Media Library - Large Media', () => {
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
