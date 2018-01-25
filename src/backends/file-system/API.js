import { Base64 } from "js-base64";
import AssetProxy from "../../valueObjects/AssetProxy";
import { SIMPLE } from "../../constants/publishModes";
import { APIError } from "../../valueObjects/errors";

export default class API {
  constructor(config) {
    this.api_root = config.api_root || "/api";
  }

  user() {
    return this.request("/user");
  }

  requestHeaders(headers = {}) {
    const baseHeader = {
      "Content-Type": "application/json",
      ...headers,
    };

    return baseHeader;
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

  request(path, options = {}) {
    const headers = this.requestHeaders(options.headers || {});
    const url = this.urlFor(path, options);
    let responseStatus;
    return fetch(url, { ...options, headers }).then((response) => {
      responseStatus = response.status;
      const contentType = response.headers.get("Content-Type");
      if (contentType && contentType.match(/json/)) {
        return this.parseJsonResponse(response);
      }
      return response.text();
    })
    .catch((error) => {
      throw new APIError(error.message, responseStatus, 'fs');
    });
  }

  readFile(path) {
    const cache = Promise.resolve(null);
    return cache.then((cached) => {
      if (cached) { return cached; }

      return this.request(`/file/${ path }`, {
        headers: { Accept: "application/octet-stream" },
        params: { },
        cache: "no-store",
      }).then((result) => {
        return result;
      });
    });
  }

  listFiles(path) {
    return this.request(`/files/${ path }`, {
      params: { },
    })
    .then((files) => {
      if (!Array.isArray(files)) {
        throw new Error(`Cannot list files, path ${ path } is not a directory but a ${ files.type }`);
      }
      return files;
    })
    .then(files => files.filter(file => file.type === "file"));
  }

  composeFileTree(files) {
    let filename;
    let part;
    let parts;
    let subtree;
    const fileTree = {};

    files.forEach((file) => {
      if (file.uploaded) { return; }
      parts = file.path.split("/").filter(part => part);
      filename = parts.pop();
      subtree = fileTree;
      while (part = parts.shift()) {
        subtree[part] = subtree[part] || {};
        subtree = subtree[part];
      }
      subtree[filename] = file;
      file.file = true;
    });

    return fileTree;
  }

  toBase64(str) {
    return Promise.resolve(
      Base64.encode(str)
    );
  }

  uploadBlob(item, newFile = false) {
    const content = item instanceof AssetProxy ? item.toBase64() : this.toBase64(item.raw);
    const method = newFile ? "POST" : "PUT"; // Always update or create new. PUT is Update existing only

    const pathID = item.path.substring(0, 1) === '/' ? item.path.substring(1, item.path.length) : item.path.toString();

    return content.then(contentBase64 => this.request(`/file/${ pathID }`, {
      method: method,
      body: JSON.stringify({
        content: contentBase64,
        encoding: "base64",
      }),
    }).then((response) => {
      item.uploaded = true;
      return item;
    }));
  }

  persistFiles(entry, mediaFiles, options) {
    const uploadPromises = [];
    const files = mediaFiles.concat(entry);

    files.forEach((file) => {
      if (file.uploaded) { return; }
      uploadPromises.push(this.uploadBlob(file, (options.newEntry && !(file instanceof AssetProxy))));
    });

    const fileTree = this.composeFileTree(files);

    return Promise.all(uploadPromises).then(() => {
      if (!options.mode || (options.mode && options.mode === SIMPLE)) {
        return fileTree;
      }
    });
  }

  deleteFile(path, message, options={}) {
    const fileURL = `/file/${ path }`;
    return this.request(fileURL, {
      method: "DELETE",
      params: { },
    });
  }

}
