import Ember from 'ember';
/**
@module app
@submodule services
*/

var Promise = Ember.RSVP.Promise;

var MediaFile = Ember.Object.extend({
  uploaded: false,
  name: null,
  size: 0,
  path: null,
  src: null,
  base64: function() {
    return this.src && this.src.split(",").pop();
  }
});

/**
  Media service is a global media handler.

  This service is used to upload new files to the CMS. When a commit is made,
  these files will be included and added to the repository.

  @class Media
  @extends Ember.Object
*/

export default Ember.Object.extend({
  uploads: Ember.A(),
  base: function() {
    return "/"+ (this.get("config.media_folder") || "uploads");
  }.property("config.media_folder"),
  previewBase: function() {
    return this.get("config.media_preview_folder") || "";
  }.property("config.media_preview_folder"),
  add: function(path, file) {
    this.remove(path);
    return new Promise(function(resolve,reject) {
      var reader = new FileReader();
      reader.onload = function() {
        var mediaFile = MediaFile.create({
          name: file.name,
          size: file.size,
          path: path,
          src: reader.result
        });
        this.uploads.pushObject(mediaFile);
        resolve(mediaFile);
      }.bind(this);
      reader.onerror = function() {
        reject("Unable to read file");
      };
      reader.readAsDataURL(file);
    }.bind(this));
  },
  find: function(path) {
    return this.get("uploads").find(function(mediaFile) { return mediaFile.path === path; });
  },
  remove: function(path) {
    this.set("uploads", this.get("uploads").reject(function(mediaFile) { return path === mediaFile.path; }));
  },
  reset: function() {
    this.set("uploads", Ember.A());
    return true;
  },
  srcFor: function(path) {
    var mediaFile = this.find(path);
    return mediaFile ? mediaFile.src : this.get("previewBase") + path;
  }
});
