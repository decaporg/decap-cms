import { API as GithubAPI } from 'netlify-cms-backend-github';
import { Config as GitHubConfig } from 'netlify-cms-backend-github/src/API';
import { APIError, FetchError } from 'netlify-cms-lib-util';

type Config = GitHubConfig & {
  apiRoot: string;
  tokenPromise: () => Promise<string>;
  commitAuthor: { name: string };
};

export default class API extends GithubAPI {
  tokenPromise: () => Promise<string>;
  commitAuthor: { name: string };

  constructor(config: Config) {
    super(config);
    this.apiRoot = config.apiRoot;
    this.tokenPromise = config.tokenPromise;
    this.commitAuthor = config.commitAuthor;
    this.repoURL = '';
    this.originRepoURL = '';
  }

  hasWriteAccess() {
    return this.getDefaultBranch()
      .then(() => true)
      .catch((error: FetchError) => {
        if (error.status === 401) {
          if (error.message === 'Bad credentials') {
            throw new APIError(
              'Git Gateway Error: Please ask your site administrator to reissue the Git Gateway token.',
              error.status,
              'Git Gateway',
            );
          } else {
            return false;
          }
        } else if (
          error.status === 404 &&
          (error.message === undefined || error.message === 'Unable to locate site configuration')
        ) {
          throw new APIError(
            `Git Gateway Error: Please make sure Git Gateway is enabled on your site.`,
            error.status,
            'Git Gateway',
          );
        } else {
          console.error('Problem fetching repo data from Git Gateway');
          throw error;
        }
      });
  }

  requestHeaders(headers = {}) {
    return this.tokenPromise().then(jwtToken => {
      const baseHeader = {
        Authorization: `Bearer ${jwtToken}`,
        'Content-Type': 'application/json; charset=utf-8',
        ...headers,
      };

      return baseHeader;
    });
  }

  handleRequestError(error: FetchError & { msg: string }, responseStatus: number) {
    throw new APIError(error.message || error.msg, responseStatus, 'Git Gateway');
  }

  user() {
    return Promise.resolve({ login: '', ...this.commitAuthor });
  }

  commit(message: string, changeTree: { parentSha?: string; sha: string }) {
    const commitParams: {
      message: string;
      tree: string;
      parents: string[];
      author?: { name: string; date: string };
    } = {
      message,
      tree: changeTree.sha,
      parents: changeTree.parentSha ? [changeTree.parentSha] : [],
    };

    if (this.commitAuthor) {
      commitParams.author = {
        ...this.commitAuthor,
        date: new Date().toISOString(),
      };
    }

    return this.request('/git/commits', {
      method: 'POST',
      body: JSON.stringify(commitParams),
    });
  }

  nextUrlProcessor() {
    return (url: string) => url.replace(/^(?:[a-z]+:\/\/.+?\/.+?\/.+?\/)/, `${this.apiRoot}/`);
  }
}
