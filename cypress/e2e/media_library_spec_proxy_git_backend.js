import fixture from './common/media_library';
import * as specUtils from './common/spec_utils';
import { entry1 } from './common/entries';

const backend = 'proxy';
const mode = 'git';

describe(`Proxy Backend Media Library - '${mode}' mode`, () => {
  let taskResult = { data: {} };

  before(() => {
    specUtils.before(taskResult, { publish_mode: 'editorial_workflow', mode }, backend);
    Cypress.config('defaultCommandTimeout', 5 * 1000);
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
