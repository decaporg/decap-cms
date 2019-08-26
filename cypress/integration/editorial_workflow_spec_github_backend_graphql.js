import fixture from './github/editorial_workflow';

describe('Github Backend Editorial Workflow - GraphQL API', () => {
  fixture({ use_graphql: true });
});
