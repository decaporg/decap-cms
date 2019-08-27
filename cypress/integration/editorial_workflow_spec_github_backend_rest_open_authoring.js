import fixture from './github/open_authoring';

describe.skip('Github Backend Editorial Workflow - REST API - Open Authoring', () => {
  fixture({ use_graphql: false });
});
