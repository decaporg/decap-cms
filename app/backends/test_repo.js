import Ember from 'ember';
/* global Base64 */

/**
@module app
@submodule backends
*/

var Promise = Ember.RSVP.Promise;

/**
 TestRepo repository backend.

 ```yaml
 backend:
   name: test_repo
 ```

 It depends on a global variable on the window object called `repoFiles`:

 ```js
 window.repoFiles = {
  "css": {
    "main.css": {
      content: "body { background: red; }"
      sha: "unique-id-for-file-in-this-state"
    }
  },
  "js": {
    "app.js": {
      content: "console.log('Hello');"
      sha: "another-unique-id-for-file-in-this-state"
    }
  }
}
 ```

 @class TestRepo
 */
export default Ember.Object.extend({
  init: function() {
    this.delay = this.config.backend.delay || 0;
  },

  authorize: function(/*credentials*/) {
    return Promise.resolve(true);
  },

  readFile: function(path) {
    var part;
    var parts = path.split("/");
    var file = window.repoFiles;
    while (part = parts.shift()){
      file = file[part];
      if (!file ) {
        return Promise.reject("No such file: " + path);
      }
    }
    return this.withDelay(file.content);
  },

  listFiles: function(path) {
    var part;
    var parts = path.split("/");
    var files = [];
    var dir = window.repoFiles;
    while (part = parts.shift()) {
      dir = dir[part];
      if (!dir ) {
        return Promise.reject("No such dir: " + dir);
      }
    }

    for (var name in dir) {
      files.push({
        name: name,
        path: path + "/" + name,
        content: dir[name].content,
        size: dir[name].content.length,
        sha: dir[name].sha
      });
    }

    return this.withDelay(files);
  },

  updateFiles: function(files) {
    var name, parts, part;
    var dir = window.repoFiles, subdir;
    files.forEach((file) => {
      subdir = dir;
      parts = file.path.split("/");
      name  = parts.pop();
      while (part = parts.shift()) {
        subdir[part] = subdir[part] || {};
        subdir = subdir[part];
      }
      subdir[name] = {
        content: file.base64 ? Base64.decode(file.base64()) : file.content,
        sha: new Date().getTime()
      };
    });

    return this.withDelay(true, files.length * 10);
  },

  withDelay: function(fn, modifier) {
    modifier = modifier || 1;
    return new Promise((resolve) => {
      setTimeout(() => { resolve(fn.call ? fn() : fn); }, this.delay * 1000 * modifier);
    });
  }
});
