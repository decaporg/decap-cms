import GithubAPI from "../github/API";

export default class API extends GithubAPI {
  constructor(config) {
    super(config);
    this.api_root = config.api_root;
    this.tokenPromise = config.tokenPromise;
    this.commitAuthor = config.commitAuthor;
    this.repoURL = "";
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
    const params = [];
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
    return this.getRequestHeaders(options.headers || {})
    .then(headers => fetch(url, { ...options, headers }))
    .then((response) => {
      const contentType = response.headers.get("Content-Type");
      if (contentType && contentType.match(/json/)) {
        return this.parseJsonResponse(response);
      }

      return response.text();
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
