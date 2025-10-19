import fixture from './common/simple_workflow';
import * as specUtils from './common/spec_utils';
import { entry1, entry2, entry3 } from './common/entries';

const backend = 'github';

describe('GitHub Backend Simple Workflow - GraphQL API', () => {
  const taskResult = { data: {} };

  before(() => {
    specUtils.before(
      taskResult,
      {
        backend: { use_graphql: true },
        publish_mode: 'simple',
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

  fixture({
    entries: [entry1, entry2, entry3],
    getUser: () => taskResult.data.user,
  });
});
