import Ember from 'ember';
/* global Base64 */

/**
@module app
@submodule backends
*/

var Promise = Ember.RSVP.Promise;
var $ = Ember.$;

/**
 NetlifyAPI repository backend.

 To use this backend, download the relevant release from [Github](https://github.com/netlify/cms-local-backend),
 make sure the binary is in your PATH and then run `netlify-local-cms` from within your website repo.

 Configure the backend in your config.yml like this:

 ```yaml
 backend:
   name: netlify_api
   url: http://localhost:8080
 ```

 @class NetlifyApi
 */
export default Ember.Object.extend({
  init: function() {
    this.base = this.config.backend.url;
    this.branch = this.config.backend.branch || "master";
  },

  authorize: function(credentials) {
    console.log("Setting token from credentials: %v", credentials);
    this.set("token", credentials.access_token);
    return Promise.resolve(true);
  },

  listFiles: function(path) {
    return new Promise((resolve, reject) => {
      this.request(this.base + "/files/" + path, {}).then(
        (data) => { resolve(data); },
        (error) => { reject(error); }
      );
    });
  },

  readFile: function(path) {
    return new Promise((resolve, reject) => {
      this.request(this.base + "/files/" + path, {
        contentType: "application/vnd.netlify.raw",
      }).then(
        (data) => { resolve(data); },
        (error) => { reject(error); }
      );
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

    return this.getRef().then((ref) =>
      Promise.all(files)
        .then(() => this.getRef())
        .then((ref) => this.getCommit(ref.object.sha))
        .then((commit) => {
          return this.updateTree(commit.tree.sha, "/", fileTree);
        })
        .then((changeTree) => {
          return this.request(this.base + "/commits", {
            type: "POST",
            data: JSON.stringify({message: options.message, tree: changeTree.sha, parents: [ref.object.sha]})
          });
        }).then((response) => {
          console.log("Done - got ref: %o", response);
          return this.request(this.base + "/refs/heads/" + this.branch, {
            type: "PATCH",
            data: JSON.stringify({sha: response.sha})
          });
        })
    );
  },

  request: function(url, settings) {
    return Ember.$.ajax(url, Ember.$.extend(true, {
      contentType: "application/json",
      headers: {Authorization: "Bearer " + this.token}
    }, settings || {}));
  },

  getRef: function() {
    return this.request(this.base + "/refs/heads/" + this.branch, {cache: false});
  },

  getCommit: function(sha) {
    return this.request(this.base + "/commits/" + sha);
  },

  getTree: function(sha) {
    return sha ? this.request(this.base + "/trees/" + sha) : Promise.resolve({tree: []});
  },

  uploadBlob: function(file) {
    return this.request(this.base + "/blobs", {
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
              {path: filename, mode: "33188", type: "blob", sha: fileOrDir.sha} :
              this.updateTree(null, filename, fileOrDir)
          );
        }
        return Promise.all(updates)
          .then((updates) => {
            return this.request(this.base + "/trees", {
              type: "POST",
              data: JSON.stringify({base_tree: sha, tree: updates})
            });
          }).then((response) => {
            return {path: path, mode: "16384", type: "tree", sha: response.sha, parentSha: sha};
          });
        });
  }
});
