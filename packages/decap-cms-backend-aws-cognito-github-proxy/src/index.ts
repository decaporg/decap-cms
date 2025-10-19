import { API } from 'decap-cms-backend-github';

import AwsCognitoGitHubProxyBackend from './implementation';

export const DecapCmsBackendAwsCognitoGithubProxy = {
  AwsCognitoGitHubProxyBackend,
  API,
};

export { AwsCognitoGitHubProxyBackend, API };
