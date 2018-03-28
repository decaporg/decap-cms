import GithubAPI from "Backends/github/API";
import { APIError } from "ValueObjects/errors";

export default class API extends GithubAPI {
  constructor(config) {
    super(config);
    this.api_root = config.api_root;
    this.tokenPromise = config.tokenPromise;
    this.commitAuthor = config.commitAuthor;
    this.repoURL = "";
  }

  hasWriteAccess() {
    return this.getBranch()
      .then(() => true)
      .catch(error => {
        if (error.status === 401) {
          if (error.message === "Bad credentials") {
            throw new Error("Git Gateway Error: Please ask your site administrator to reissue the Git Gateway token.");
          } else {
            return false;
          }
        } else {
          console.error("Problem fetching repo data from GitHub");
          throw error;
        }
      });
  }

  getRequestHeaders(headers = {}) {
    return this.tokenPromise()
    .then((jwtToken) => {
      const baseHeader = {
        "Authorization": `Bearer ${ jwtToken }`,
        "Content-Type": "application/json",
        ...headers,
      };

      return baseHeader;
    });
  }


  urlFor(path, options) {
    const cacheBuster = new Date().getTime();
    const params = [`ts=${ cacheBuster }`];
    if (options.params) {
      for (const key in options.params) {
        params.push(`${ key }=${ encodeURIComponent(options.params[key]) }`);
      }
    }
    if (params.length) {
      path += `?${ params.join("&") }`;
    }
    return this.api_root + path;
  }

  user() {
    return Promise.resolve(this.commitAuthor);
  }

  request(path, options = {}) {
    const url = this.urlFor(path, options);
    let responseStatus;
    return this.getRequestHeaders(options.headers || {})
    .then(headers => fetch(url, { ...options, headers }))
    .then((response) => {
      responseStatus = response.status;
      const contentType = response.headers.get("Content-Type");
      if (contentType && contentType.match(/json/)) {
        return this.parseJsonResponse(response);
      }

      return response.text();
    })
    .catch(error => {
      throw new APIError(error.message, responseStatus, 'Git Gateway');
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

    return this.request("/git/commits", {
      method: "POST",
      body: JSON.stringify(commitParams),
    });
  }

}
