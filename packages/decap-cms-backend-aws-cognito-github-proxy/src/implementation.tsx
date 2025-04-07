import * as React from 'react';
import { GitHubBackend } from 'decap-cms-backend-github';
import { PKCEAuthenticationPage } from 'decap-cms-ui-auth';

import type { GitHubUser } from 'decap-cms-backend-github/src/implementation';
import type { Config } from 'decap-cms-lib-util/src';
import type { Octokit } from '@octokit/rest';

export default class AwsCognitoGitHubProxyBackend extends GitHubBackend {
  constructor(config: Config, options = {}) {
    super(config, options);

    this.bypassWriteAccessCheckForAppTokens = true;
    this.tokenKeyword = 'Bearer';
  }

  authComponent() {
    const wrappedAuthenticationPage = (props: Record<string, unknown>) => {
      const allProps = { ...props, backend: this };
      return <PKCEAuthenticationPage {...allProps} />;
    };
    wrappedAuthenticationPage.displayName = 'AuthenticationPage';
    return wrappedAuthenticationPage;
  }

  async currentUser({ token }: { token: string }): Promise<GitHubUser> {
    if (!this._currentUserPromise) {
      this._currentUserPromise = fetch(this.baseUrl + '/oauth2/userInfo', {
        headers: {
          Authorization: `${this.tokenKeyword} ${token}`,
        },
      }).then(async (res: Response): Promise<GitHubUser> => {
        if (res.status == 401) {
          this.logout();
          return Promise.reject('Token expired');
        }
        const userInfo = await res.json();
        const owner = this.originRepo.split('/')[1];
        return {
          name: userInfo.email,
          login: owner,
          avatar_url: `https://github.com/${owner}.png`,
        } as GitHubUser;
      });
    }
    return this._currentUserPromise;
  }

  async getPullRequestAuthor(pullRequest: Octokit.PullsListResponseItem) {
    return pullRequest.user?.login;
  }
}
