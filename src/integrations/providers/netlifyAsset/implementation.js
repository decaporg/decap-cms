export default class NetlifyAsset {
  constructor(config) {
    this.config = config;
    if (config.get('applicationID') == null) {
      throw 'The NetlifyAsset integration needs the applicationID in the integration configuration.';
    }

    this.applicationID = config.get('applicationID');
    this.apiToken = config.get('apiToken');

    this.assetURL = `https://api.netlify.com/api/v1/sites/${ this.applicationID }/assets`;
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

  upload(file) {
    return this.request(this.assetURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ this.apiToken }`,
      },
      body: JSON.stringify({
        name: file.name,
        size: file.size,
        content_type: file.type,
      }),
    })
    .then((response) => {
      const formURL = response.form.url;
      const formFields = response.form.fields;
      const assetURL = response.asset.url;
      
      const formData = new FormData();
      Object.keys(formFields).forEach(key => formData.append(key, formFields[key]));
      formData.append('file', file, file.name);

      return this.request(formURL, {
        method: 'POST',
        headers: {
          Accept: 'application/xml',
        },
        body: formData,
      }).then(() => ({ success: true, assetURL }));
    });
  }
}

