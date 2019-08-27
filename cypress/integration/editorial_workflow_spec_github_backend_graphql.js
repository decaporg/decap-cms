import fixture from './github/editorial_workflow';

describe.skip('Github Backend Editorial Workflow - GraphQL API', () => {
  fixture({ use_graphql: true });
});
