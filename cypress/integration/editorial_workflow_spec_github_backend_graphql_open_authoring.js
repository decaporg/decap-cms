import fixture from './github/open_authoring';

describe.skip('Github Backend Editorial Workflow - GraphQL API - Open Authoring', () => {
  fixture({ use_graphql: true });
});
