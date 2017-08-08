import LocalForage from "localforage";
import { Base64 } from "js-base64";
import { isString } from "lodash";
import AssetProxy from "../../valueObjects/AssetProxy";
import { APIError } from "../../valueObjects/errors";

export default class API {
  constructor(config) {
    this.api_root = config.api_root || "https://gitlab.com/api/v4";
    this.token = config.token || false;
    this.branch = config.branch || "master";
    this.repo = config.repo || "";
    this.repoURL = `/projects/${ encodeURIComponent(this.repo) }`;
  }

  user() {
    return this.request("/user");
  }

  isCollaborator(user) {
    const WRITE_ACCESS = 30;
    return this.request(`${ this.repoURL }/members/${ user.id }`)
      .then(member => (member.access_level >= WRITE_ACCESS))
      .catch((err) => {
        // Member does not have any access. We cannot just check for 404,
        //   because a 404 is also returned if we have the wrong URI,
        //   just with an "error" key instead of a "message" key.
        if (err.status === 404 && err.meta.errorValue["message"] === "404 Not found") {
          return false;
        } else {
          // Otherwise, it is actually an API error.
          throw err;
        }
      });
  }

  requestHeaders(headers = {}) {
    return {
      ...headers,
      ...(this.token ? { Authorization: `Bearer ${ this.token }` } : {}),
    };
  }

  urlFor(path, options) {
    const cacheBuster = `ts=${ new Date().getTime() }`;
    const encodedParams = options.params
          ? Object.entries(options.params).map(
            ([key, val]) => `${ key }=${ encodeURIComponent(val) }`)
          : [];
    return this.api_root + path + `?${ [cacheBuster, ...encodedParams].join("&") }`;
  }

  request(path, options = {}) {
    const headers = this.requestHeaders(options.headers || {});
    const url = this.urlFor(path, options);
    
    return fetch(url, { ...options, headers }).then((response) => {
      const contentType = response.headers.get("Content-Type");
      if (options.method === "HEAD") {
        return Promise.all([response]);
      }
      if (contentType && contentType.match(/json/)) {
        return Promise.all([response, response.json()]);
      }
      return Promise.all([response, response.text()]);
    })
    .catch(err => [err, null])
    .then(([response, value]) => {
      if (!response.ok) return Promise.reject([value, response]);
      /* TODO: remove magic. */
      if (value === undefined) return response;
      /* OK */
      return value;
    })
    .catch(([errorValue, response]) => {
      const message = (errorValue && errorValue.message)
        ? errorValue.message
        : (isString(errorValue) ? errorValue : "");
      throw new APIError(message, response && response.status, 'GitLab', { response, errorValue });
    });
  }
  
  readFile(path, sha, branch = this.branch) {
    const cache = sha ? LocalForage.getItem(`gh.${ sha }`) : Promise.resolve(null);
    return cache.then((cached) => {
      if (cached) { return cached; }
      
      // Files must be downloaded from GitLab as base64 due to this bug:
      //   https://gitlab.com/gitlab-org/gitlab-ce/issues/31470
      return this.request(`${ this.repoURL }/repository/files/${ encodeURIComponent(path) }`, {
        params: { ref: branch },
        cache: "no-store",
      }).then(response => this.fromBase64(response.content))
      .then((result) => {
        if (sha) {
          LocalForage.setItem(`gh.${ sha }`, result);
        }
        return result;
      });
    });
  }
  
  fileExists(path, branch = this.branch) {
    return this.request(`${ this.repoURL }/repository/files/${ encodeURIComponent(path) }`, {
      method: "HEAD",
      params: { ref: branch },
      cache: "no-store",
    }).then(() => true).catch((err) => {
      // TODO: 404 can mean either the file does not exist, or if an API
      //   endpoint doesn't exist. Is there a better way to check for this?
      if (err.status === 404) {return false;} else {throw err;}
    });
  }

  listFiles(path) {
    return this.request(`${ this.repoURL }/repository/tree`, {
      params: { path, ref: this.branch },
    })
    .then((files) => {
      if (!Array.isArray(files)) {
        throw new Error(`Cannot list files, path ${path} is not a directory but a ${files.type}`);
      }
      return files;
    })
    .then(files => files.filter(file => file.type === "blob"));
  }

  persistFiles(entry, mediaFiles, options) {
    const newMedia = mediaFiles.filter(file => !file.uploaded);
    const mediaUploads = newMedia.map(file => this.fileExists(file.path).then(exists => {
      return this.uploadAndCommit(file, {
        commitMessage: `${ options.commitMessage }: create ${ file.value }.`,
        newFile: !exists
      });
    }));
    
    // Wait until media files are uploaded before we commit the main entry.
    //   This should help avoid inconsistent state.
    return Promise.all(mediaUploads)
    .then(() => this.uploadAndCommit(entry, {
      commitMessage: options.commitMessage,
      newFile: options.newEntry
    }));
  }

  deleteFile(path, commit_message, options={}) {
    const branch = options.branch || this.branch;
    return this.request(`${ this.repoURL }/repository/files/${ encodeURIComponent(path) }`, {
      method: "DELETE",
      params: { commit_message, branch },
    });
  }

  toBase64(str) {
    return Promise.resolve(
      Base64.encode(str)
    );
  }

  fromBase64(str) {
    return Base64.decode(str);
  }

  uploadAndCommit(item, {commitMessage, newFile = true, branch = this.branch}) {
    const content = item instanceof AssetProxy ? item.toBase64() : this.toBase64(item.raw);
    // Remove leading slash from path if exists.
    const file_path = item.path.replace(/^\//, '');
    
    // We cannot use the `/repository/files/:file_path` format here because the file content has to go
    //   in the URI as a parameter. This overloads the OPTIONS pre-request (at least in Chrome 61 beta).
    return content.then(contentBase64 => this.request(`${ this.repoURL }/repository/commits`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        branch,
        commit_message: commitMessage,
        actions: [{
          action: (newFile ? "create" : "update"),
          file_path,
          content: contentBase64,
          encoding: "base64",
        }]
      }),
    })).then(response => Object.assign({}, item, {
      sha: response.sha,
      uploaded: true,
    }));
  }
}