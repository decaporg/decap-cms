import Ember from 'ember';
/* global Base64 */

/**
@module app
@submodule backends
*/

var Promise = Ember.RSVP.Promise;
var ENDPOINT = "https://api.github.com/";


/**
 Github API repository backend.

 ```yaml
 backend:
   name: github_api
   repo: netlify/netlify-home
   branch: master
 ```

 This backend uses the Git Data API to create commits when updateFiles is called.

 @class GithubAPI
 */
export default Ember.Object.extend({
  /**
    Sets up a new Github API backend

    The config requires a `repo` and a `branch`.

    @method constructor
    @param {Config} config
    @return {GithubAPI} github_backend
  */
  init: function() {
    var config = this.get("config");
    this.base = ENDPOINT + "repos/" + (config && config.backend.repo);
    this.branch = config && config.backend.branch;
    this.config = config;
  },

  /**
    Authorize a user via a github_access_token.

    @method authorize
    @param {Object} credentials
    @return {Promise} result
  */
  authorize: function(credentials) {
    this.token = credentials.github_access_token;
    return new Promise((resolve,reject) => {
      this.request(this.base).then((repo) =>{
        if (repo.permissions.push && repo.permissions.pull) {
          resolve();
        } else {
          reject(`This user doesn't have write access to the repo '${this.config.repo}'`);
        }
      }, (err) => {
        console.log("Auth error: %o", err);
        reject(`This user couldn't access the repo '${this.config.repo}'`);
      });
    });
  },

  /**
    Read the content of a file in the repository

    @method readFile
    @param {String} path
    @return {String} content
  */
  readFile: function(path) {
    return this.request(this.base + "/contents/" + path, {
      headers: {Accept: "application/vnd.github.VERSION.raw"},
      data: {ref: this.branch},
      cache: false
    });
  },

  /**
    Get a list of files in the repository

    @method listFiles
    @param {String} path
    @return {Array} files
  */
  listFiles: function(path) {
    return this.request(this.base + "/contents/" + path, {
      data: {ref: this.branch}
    });
  },

  /**
    Update files in the repo with a commit.

    A commit message can be specified in `options` as `message`.

    @method updateFiles
    @param {Array} uploads
    @param {Object} options
    @return {Promise} result
  */
  updateFiles: function(uploads, options) {
    var filename, part, parts, subtree;
    var fileTree = {};
    var files = [];

    uploads.forEach((file) => {
      if (file.uploaded) { return; }
      files.push(file.upload ? file : this.uploadBlob(file));
      parts = file.path.split("/").filter((part) => part);
      filename = parts.pop();
      subtree = fileTree;
      while (part = parts.shift()) {
        subtree[part] = subtree[part] || {};
        subtree = subtree[part];
      }
      subtree[filename] = file;
      file.file = true;
    });

    return Promise.all(files)
      .then(() => this.getBranch())
      .then((branchData) => {
        return this.updateTree(branchData.commit.sha, "/", fileTree);
      })
      .then((changeTree) => {
        return this.request(this.base + "/git/commits", {
          type: "POST",
          data: JSON.stringify({message: options.message, tree: changeTree.sha, parents: [changeTree.parentSha]})
        });
      }).then((response) => {
        return this.request(this.base + "/git/refs/heads/" + this.branch, {
          type: "PATCH",
          data: JSON.stringify({sha: response.sha})
        });
      });
  },

  request: function(url, settings) {
    return Ember.$.ajax(url, Ember.$.extend(true, {
      headers: {Authorization: "Bearer " + this.token},
      contentType: "application/json"
    }, settings || {}));
  },

  getBranch: function() {
    return this.request(this.base + "/branches/" + this.branch, {cache: false});
  },

  getTree: function(sha) {
    return sha ? this.request(this.base + "/git/trees/" + sha) : Promise.resolve({tree: []});
  },

  uploadBlob: function(file) {
    return this.request(this.base + "/git/blobs", {
      type: "POST",
      data: JSON.stringify({
        content: file.base64 ? file.base64() : Base64.encode(file.content),
        encoding: "base64"
      })
    }).then((response) => {
      file.sha = response.sha;
      file.uploaded = true;
      return file;
    });
  },

  updateTree: function(sha, path, fileTree) {
    return this.getTree(sha)
      .then((tree) => {
        var obj, filename, fileOrDir;
        var updates = [];
        var added = {};

        for (var i=0, len=tree.tree.length; i<len; i++) {
          obj = tree.tree[i];
          if (fileOrDir = fileTree[obj.path]) {
            added[obj.path] = true;
            if (fileOrDir.file) {
              updates.push({path: obj.path, mode: obj.mode, type: obj.type, sha: fileOrDir.sha});
            } else {
              updates.push(this.updateTree(obj.sha, obj.path, fileOrDir));
            }
          }
        }
        for (filename in fileTree) {
          fileOrDir = fileTree[filename];
          if (added[filename]) { continue; }
          updates.push(
            fileOrDir.file ?
              {path: filename, mode: "100644", type: "blob", sha: fileOrDir.sha} :
              this.updateTree(null, filename, fileOrDir)
          );
        }
        return Promise.all(updates)
          .then((updates) => {
            return this.request(this.base + "/git/trees", {
              type: "POST",
              data: JSON.stringify({base_tree: sha, tree: updates})
            });
          }).then((response) => {
            return {path: path, mode: "040000", type: "tree", sha: response.sha, parentSha: sha};
          });
        });
  }
});
