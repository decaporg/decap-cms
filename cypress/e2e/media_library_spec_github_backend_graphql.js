import fixture from './common/media_library';
import { entry1 } from './common/entries';
import * as specUtils from './common/spec_utils';

const backend = 'github';

describe('GitHub Backend Media Library - GraphQL API', () => {
  const taskResult = { data: {} };

  before(() => {
    specUtils.before(
      taskResult,
      {
        backend: { use_graphql: true },
        publish_mode: 'editorial_workflow',
      },
      backend,
    );
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
