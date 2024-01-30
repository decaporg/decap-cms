import { API } from 'decap-cms-backend-github';

import AwsCognitoGitHubProxyBackend from './implementation';
import AuthenticationPage from './AuthenticationPage';

export const DecapCmsBackendAwsCognitoGithubProxy = {
  AwsCognitoGitHubProxyBackend,
  API,
  AuthenticationPage,
};

export { AwsCognitoGitHubProxyBackend, API, AuthenticationPage };
