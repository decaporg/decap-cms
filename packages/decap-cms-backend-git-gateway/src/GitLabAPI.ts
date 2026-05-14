import { API as GitlabAPI } from 'decap-cms-backend-gitlab';
import { unsentRequest } from 'decap-cms-lib-util';

import type { Config as GitLabConfig, CommitAuthor } from 'decap-cms-backend-gitlab/src/API';
import type { ApiRequest } from 'decap-cms-lib-util';

type Config = GitLabConfig & { tokenPromise: () => Promise<string>; commitAuthor: CommitAuthor };

export default class API extends GitlabAPI {
  tokenPromise: () => Promise<string>;

  constructor(config: Config) {
    super(config);
    this.tokenPromise = config.tokenPromise;
    this.commitAuthor = config.commitAuthor;
    this.repoURL = '';
  }

  withAuthorizationHeaders = async (req: ApiRequest) => {
    const token = await this.tokenPromise();
    return unsentRequest.withHeaders(
      {
        Authorization: `Bearer ${token}`,
      },
      req,
    );
  };

  hasWriteAccess = () => Promise.resolve(true);
}
