import fixture from './media/media_library';
import { entry1 } from './github/entries';
import * as specUtils from './github/spec_utils';

describe('GitHub Backend Media Library - GraphQL API', () => {
  let taskResult = { data: {} };

  before(() => {
    specUtils.before(taskResult, { use_graphql: true });
  });

  after(() => {
    specUtils.after(taskResult);
  });

  beforeEach(() => {
    specUtils.beforeEach(taskResult);
  });

  afterEach(() => {
    specUtils.afterEach(taskResult);
  });

  fixture({ entries: [entry1], getUser: () => taskResult.data.user });
});
