import { createEntry } from '../../../valueObjects/Entry';

function getSlug(path) {
  const m = path.match(/([^\/]+?)(\.[^\/\.]+)?$/);
  return m && m[1];
}

export default class Algolia {
  constructor(config) {
    this.config = config;
    if (config.getIn(['integrations', 'search', 'applicationID']) == null ||
        config.getIn(['integrations', 'search', 'apiKey']) == null) {
      throw 'The Algolia search integration needs the credentials (applicationID and apiKey) in the integration configuration.';
    }

    this.applicationID = config.getIn(['integrations', 'search', 'applicationID']);
    this.apiKey = config.getIn(['integrations', 'search', 'apiKey']);
    this.searchURL = `https://${this.applicationID}-dsn.algolia.net/1`;
  }

  requestHeaders(headers = {}) {
    return {
      'X-Algolia-API-Key': this.apiKey,
      'X-Algolia-Application-Id': this.applicationID,
      'Content-Type': 'application/json',
      ...headers
    };
  }

  parseJsonResponse(response) {
    return response.json().then((json) => {
      if (!response.ok) {
        return Promise.reject(json);
      }

      return json;
    });
  }

  urlFor(path, options) {
    const params = [];
    if (options.params) {
      for (const key in options.params) {
        params.push(`${key}=${encodeURIComponent(options.params[key])}`);
      }
    }
    if (params.length) {
      path += `?${params.join('&')}`;
    }
    return path;
  }

  request(path, options = {}) {
    const headers = this.requestHeaders(options.headers || {});
    const url = this.urlFor(path, options);
    return fetch(url, { ...options, headers: headers }).then((response) => {
      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.match(/json/)) {
        return this.parseJsonResponse(response);
      }

      return response.text();
    });
  }

  search(collection, query) {
    return this.request(`${this.searchURL}/indexes/${collection}`, {
      params: { query }
    });
  }

  entries(collection, page = 0) {
    return this.request(`${this.searchURL}/indexes/${collection.get('name')}`, {
      params: { page }
    }).then(response => {
      const entries = response.hits.map(hit => {
        const slug = hit.slug || getSlug(hit.path);
        return createEntry(collection.get('name'), slug, hit.path, { data: hit.data, partial: true });
      });
      return { page: response.page, entries };
    });
  }
}
