export default class AssetStore {
  constructor(config, getToken) {
    this.config = config;
    if (config.get('getSignedFormURL') == null) {
      throw 'The AssetStore integration needs the getSignedFormURL in the integration configuration.';
    }
    this.getToken = getToken;

    this.shouldConfirmUpload = config.get('shouldConfirmUpload', false);
    this.getSignedFormURL = config.get('getSignedFormURL');
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

  retrieve() {
    return this.getToken()
      .then(token => this.request(this.getSignedFormURL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ token }`,
        },
      }))
      .then(files => files.map(({ id, name, size, url }) => {
        return { id, name, size, url, urlIsPublicPath: true };
      }));
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

  upload(file, privateUpload = false) {
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

    return this.getToken()
    .then(token => this.request(this.getSignedFormURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ token }`,
      },
      body: JSON.stringify(fileData),
    }))
    .then((response) => {
      const formURL = response.form.url;
      const formFields = response.form.fields;
      const assetID = response.asset.id;
      const assetURL = response.asset.url;

      const formData = new FormData();
      Object.keys(formFields).forEach(key => formData.append(key, formFields[key]));
      formData.append('file', file, file.name);

      return this.request(formURL, {
        method: 'POST',
        body: formData,
      })
      .then(() => {
        if (this.shouldConfirmUpload) this.confirmRequest(assetID);
        return { success: true, assetURL };
      });
    });
  }
}
