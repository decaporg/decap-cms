import fixture from './github/editorial_workflow';

describe.skip('Github Backend Editorial Workflow - REST API', () => {
  fixture({ use_graphql: false });
});
