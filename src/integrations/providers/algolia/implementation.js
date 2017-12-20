import _ from 'lodash';
import { createEntry } from 'ValueObjects/Entry';
import { selectEntrySlug } from 'Reducers/collections';

function getSlug(path) {
  return path.split('/').pop().replace(/\.[^\.]+$/, '');
}

export default class Algolia {
  constructor(config) {
    this.config = config;
    if (config.get('applicationID') == null ||
        config.get('apiKey') == null) {
      throw 'The Algolia search integration needs the credentials (applicationID and apiKey) in the integration configuration.';
    }

    this.applicationID = config.get('applicationID');
    this.apiKey = config.get('apiKey');

    const prefix = config.get('indexPrefix');
    this.indexPrefix = prefix ? `${ prefix }-` : '';

    this.searchURL = `https://${ this.applicationID }-dsn.algolia.net/1`;

    this.entriesCache = {
      collection: null,
      page: null,
      entries: [],
    };
  }

  requestHeaders(headers = {}) {
    return {
      'X-Algolia-API-Key': this.apiKey,
      'X-Algolia-Application-Id': this.applicationID,
      'Content-Type': 'application/json',
      ...headers,
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
        params.push(`${ key }=${ encodeURIComponent(options.params[key]) }`);
      }
    }
    if (params.length) {
      path += `?${ params.join('&') }`;
    }
    return path;
  }

  request(path, options = {}) {
    const headers = this.requestHeaders(options.headers || {});
    const url = this.urlFor(path, options);
    return fetch(url, { ...options, headers }).then((response) => {
      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.match(/json/)) {
        return this.parseJsonResponse(response);
      }

      return response.text();
    });
  }

  search(collections, searchTerm, page) {
    const searchCollections = collections.map(collection => (
      { indexName: `${ this.indexPrefix }${ collection }`, params: `query=${ searchTerm }&page=${ page }` }
    ));

    return this.request(`${ this.searchURL }/indexes/*/queries`, {
      method: 'POST',
      body: JSON.stringify({ requests: searchCollections }),
    }).then((response) => {
      const entries = response.results.map((result, index) => result.hits.map((hit) => {
        const slug = getSlug(hit.path);
        return createEntry(collections[index], slug, hit.path, { data: hit.data, partial: true });
      }));

      return { entries: _.flatten(entries), pagination: page };
    });
  }

  searchBy(field, collection, query) {
    return this.request(`${ this.searchURL }/indexes/${ this.indexPrefix }${ collection }`, {
      params: {
        restrictSearchableAttributes: field,
        query,
      },
    });
  }

  listEntries(collection, page) {
    if (this.entriesCache.collection === collection && this.entriesCache.page === page) {
      return Promise.resolve({ page: this.entriesCache.page, entries: this.entriesCache.entries });
    } else {
      return this.request(`${ this.searchURL }/indexes/${ this.indexPrefix }${ collection.get('name') }`, {
        params: { page },
      }).then((response) => {
        const entries = response.hits.map((hit) => {
          const slug = selectEntrySlug(collection, hit.path);
          return createEntry(collection.get('name'), slug, hit.path, { data: hit.data, partial: true });
        });
        this.entriesCache = { collection, pagination: response.page, entries };
        return { entries, pagination: response.page };
      });
    }
  }

  getEntry(collection, slug) {
    return this.searchBy('slug', collection.get('name'), slug).then((response) => {
      const entry = response.hits.filter(hit => hit.slug === slug)[0];
      return createEntry(collection.get('name'), slug, entry.path, { data: entry.data, partial: true });
    });
  }
}
