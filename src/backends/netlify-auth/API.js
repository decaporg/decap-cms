import GithubAPI from "../github/API";

export default class API extends GithubAPI {
  constructor(config) {
    super(config);
    this.api_root = config.api_root;
    this.jwtToken = config.jwtToken;
    this.repoURL = "";

    console.log(config);
  }


  requestHeaders(headers = {}) {
    const baseHeader = {
      Authorization: `Bearer ${ this.jwtToken }`,
      "Content-Type": "application/json",
      ...headers,
    };

    return baseHeader;
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
    console.log(this.api_root, path);
    return this.api_root + path;
  }

  request(path, options = {}) {
    const headers = this.requestHeaders(options.headers || {});
    console.log(path, options);
    const url = this.urlFor(path, options);
    console.log(url);
    return fetch(url, { ...options, headers }).then((response) => {
      const contentType = response.headers.get("Content-Type");
      if (contentType && contentType.match(/json/)) {
        return this.parseJsonResponse(response);
      }

      return response.text();
    });
  }


}
