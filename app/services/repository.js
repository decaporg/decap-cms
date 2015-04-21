import Ember from 'ember';
import Cache from './object_cache/cache';
/* global Base64 */

var Promise = Ember.RSVP.Promise;
var base, branch;
var ENDPOINT = "https://api.github.com/";
var token = null;

function request(url, settings) {
  return Ember.$.ajax(url, Ember.$.extend(true, {headers: {Authorization: "Bearer " + token}, contentType: "application/json"}, settings || {}));
}

function getBranch() {
  return request(base+ "/branches/" + branch, {cache: false});
}

function getTree(sha) {
  return sha ? request(base + "/git/trees/" + sha) : Promise.resolve({tree: []});
}

function uploadBlob(file) {
  return request(base + "/git/blobs", {
    type: "POST",
    data: JSON.stringify({
      content: file.base64 ? file.base64() : Base64.encode(file.content),
      encoding: "base64"
    })
  }).then(function(response) {
    file.sha = response.sha;
    file.uploaded = true;
    return file;
  });
}

function updateTree(sha, path, fileTree) {
  return getTree(sha)
    .then(function(tree) {
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
            updates.push(updateTree(obj.sha, obj.path, fileOrDir));
          }
        }
      }
      for (filename in fileTree) {
        fileOrDir = fileTree[filename];
        if (added[filename]) { continue; }
        updates.push(
          fileOrDir.file ?
            {path: filename, mode: "100644", type: "blob", sha: fileOrDir.sha} :
            updateTree(null, filename, fileOrDir)
        );
      }
      return Promise.all(updates)
        .then(function(updates) {
          return request(base + "/git/trees", {
            type: "POST",
            data: JSON.stringify({base_tree: sha, tree: updates})
          });
        }).then(function(response) {
          return {path: path, mode: "040000", type: "tree", sha: response.sha, parentSha: sha};
        });
      });
}

export default Ember.Object.extend({
  init: function() {
    this.fileCache = Cache.create({});
  },
  configure: function(config, newToken) {
    base = ENDPOINT + "repos/" + config.repo;
    branch = config.branch;
    token = newToken;
  },
  readFiles: function(path) {
    return request(base + "/contents/" + path, {
      data: {ref: branch}
    });
  },
  readFile: function(path, sha) {
    if (sha) {
      return this.fileCache.get(sha).then(function(content) {
        return content;
      }, function() {
        return this.readFile(path).then(function(content) {
          this.fileCache.set(sha, content);
          return content;
        }.bind(this));
      }.bind(this));
    } else {
      return request(base + "/contents/" + path, {
        headers: {Accept: "application/vnd.github.VERSION.raw"},
        data: {ref: branch},
        cache: false
      });
    }
  },
  updateFiles: function(options) {
    var file, filename, part, parts, subtree;
    var fileTree = {};
    var files = [];
    var media = this.get("media");
    var uploads = (options.files || []).concat(media.get("uploads"));

    for (var i=0, len=uploads.length; i<len; i++) {
      file = uploads[i];
      if (file.uploaded) { continue; }
      files.push(file.upload ? file : uploadBlob(file));
      parts = file.path.split("/").filter(function(part) { return part; });
      filename = parts.pop();
      subtree = fileTree;
      while (part = parts.shift()) {
        subtree[part] = subtree[part] || {};
        subtree = subtree[part];
      }
      subtree[filename] = file;
      file.file = true;
    }
    return Promise.all(files)
      .then(getBranch)
      .then(function(branchData) {
        return updateTree(branchData.commit.sha, "/", fileTree);
      })
      .then(function(changeTree) {
        return request(base + "/git/commits", {
          type: "POST",
          data: JSON.stringify({message: options.message, tree: changeTree.sha, parents: [changeTree.parentSha]})
        });
      }).then(function(response) {
        return request(base + "/git/refs/heads/" + branch, {
          type: "PATCH",
          data: JSON.stringify({sha: response.sha})
        });
      });
  }
});
