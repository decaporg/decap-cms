import { flow } from 'lodash';
import { API as GitlabAPI } from 'netlify-cms-backend-gitlab';
import { Config as GitHubConfig, CommitAuthor } from 'netlify-cms-backend-gitlab/src/API';
import { unsentRequest, then, ApiRequest } from 'netlify-cms-lib-util';

type Config = GitHubConfig & { tokenPromise: () => Promise<string>; commitAuthor: CommitAuthor };

export default class API extends GitlabAPI {
  tokenPromise: () => Promise<string>;

  constructor(config: Config) {
    super(config);
    this.tokenPromise = config.tokenPromise;
    this.commitAuthor = config.commitAuthor;
    this.repoURL = '';
  }

  authenticateRequest = async (req: ApiRequest) =>
    unsentRequest.withHeaders(
      {
        Authorization: `Bearer ${await this.tokenPromise()}`,
      },
      req,
    );

  request = async (req: ApiRequest) =>
    flow([this.buildRequest, this.authenticateRequest, then(unsentRequest.performRequest)])(req);

  hasWriteAccess = () => Promise.resolve(true);
}
