import { pickBy, trimEnd, get } from 'lodash';
import parseLinkHeader from 'parse-link-header';
import { addParams } from 'Lib/urlHelper';

export default class AssetStore {
  constructor(config, getToken) {
    this.config = config;
    if (config.get('getSignedFormURL') == null) {
      throw 'The AssetStore integration needs the getSignedFormURL in the integration configuration.';
    }
    this.getToken = getToken;

    this.shouldConfirmUpload = config.get('shouldConfirmUpload', false);
    this.getSignedFormURL = trimEnd(config.get('getSignedFormURL'), '/');
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


  requestHeaders(headers = {}) {
    return {
      ...headers,
    };
  }

  confirmRequest(assetID) {
    this.getToken()
    .then(token => this.request(`${ this.getSignedFormURL }/${ assetID }`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ token }`,
      },
      body: JSON.stringify({ state: 'uploaded' }),
    }));
  }

  async request(path, options = {}, setCursor) {
    const headers = this.requestHeaders(options.headers || {});
    const url = this.urlFor(path, options);
    const response = await fetch(url, { ...options, headers });
    const contentType = response.headers.get('Content-Type');
    const isJson = contentType && contentType.match(/json/);
    const content = isJson ? await this.parseJsonResponse(response) : response.text();
    if (response.ok && setCursor) {
      const nextPage = get(parseLinkHeader(response.headers.get('Link')), ['next', 'page']);
      setCursor(nextPage);
    }
    return content;
  }

  async retrieve(query, cursor = 1, setCursor, privateUpload) {
    const params = pickBy({
      search: query,
      filter: privateUpload ? 'private' : 'public',
      page: cursor,
    }, val => !!val);
    const url = addParams(this.getSignedFormURL, params);
    const token = await this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ token }`,
    };
    const response = await this.request(url, { headers }, setCursor);
    const files = response.map(({ id, name, size, url }) => {
      return { id, name, size, url, urlIsPublicPath: true };
    });

    /**
     * The Link header pagination info doesn't reflect queried results, so we
     * manually stop paging when a page comes back empty.
     */
    if (!files.length) {
      setCursor(null);
    }
    return files;
  }

  delete(assetID) {
    const url = `${ this.getSignedFormURL }/${ assetID }`
    return this.getToken()
      .then(token => this.request(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ token }`,
        },
      }));
  }

  async upload(file, privateUpload = false) {
    const fileData = {
      name: file.name,
      size: file.size
    };
    if (file.type) {
      fileData.content_type = file.type;
    }

    if (privateUpload) {
      fileData.visibility = 'private';
    }

    try {
      const token = await this.getToken();
      const response = await this.request(this.getSignedFormURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ token }`,
        },
        body: JSON.stringify(fileData),
      });
      const formURL = response.form.url;
      const formFields = response.form.fields;
      const { id, name, size, url } = response.asset;

      const formData = new FormData();
      Object.keys(formFields).forEach(key => formData.append(key, formFields[key]));
      formData.append('file', file, file.name);

      await this.request(formURL, { method: 'POST', body: formData });

      if (this.shouldConfirmUpload) {
        await this.confirmRequest(id);
      }

      const asset = { id, name, size, url, urlIsPublicPath: true };
      return { success: true, url, asset };
    }
    catch(error) {
      console.error(error);
    }
  }
}
