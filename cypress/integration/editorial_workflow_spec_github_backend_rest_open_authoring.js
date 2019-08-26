import fixture from './github/open_authoring';

describe('Github Backend Editorial Workflow - REST API - Open Authoring', () => {
  fixture({ use_graphql: false });
});
