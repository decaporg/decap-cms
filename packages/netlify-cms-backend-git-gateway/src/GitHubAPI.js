import { API as GithubAPI } from 'netlify-cms-backend-github';
import { APIError, unsentRequest } from 'netlify-cms-lib-util';
import { flow } from 'lodash';

export default class API extends GithubAPI {
  constructor(config) {
    super(config);
    this.api_root = config.api_root;
    this.tokenPromise = config.tokenPromise;
    this.commitAuthor = config.commitAuthor;
    this.repoURL = '';
  }

  buildRequest = req =>
    flow([unsentRequest.withRoot(this.api_root), unsentRequest.withTimestamp])(req);

  performRequest = async req => {
    const jwtToken = await this.tokenPromise();
    const reqWithHeaders = {
      ...req,
      headers: {
        ...req.headers,
        Authorization: `Bearer ${jwtToken}`,
        ['Content-Type']: 'application/json',
      },
    };
    return flow([
      this.buildRequest,
      unsentRequest.performRequest,
      p =>
        p.catch(err => Promise.reject(new APIError(err.message || err.msg, null, 'Git Gateway'))),
    ])(reqWithHeaders);
  };

  hasWriteAccess() {
    return this.getBranch()
      .then(() => true)
      .catch(error => {
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

  user() {
    return Promise.resolve(this.commitAuthor);
  }

  request(url, options = {}) {
    const req = { url, ...options };
    let responseStatus;
    return this.performRequest(req)
      .then(response => {
        responseStatus = response.status;
        return this.parseResponse(response);
      })
      .catch(error => {
        throw new APIError(error.message || error.msg, responseStatus, 'Git Gateway');
      });
  }

  commit(message, changeTree) {
    const commitParams = {
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
}
