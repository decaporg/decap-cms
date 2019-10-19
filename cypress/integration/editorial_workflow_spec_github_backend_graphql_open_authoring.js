import fixture from './github/open_authoring';

describe('Github Backend Editorial Workflow - GraphQL API - Open Authoring', () => {
  fixture({ use_graphql: true });
});
