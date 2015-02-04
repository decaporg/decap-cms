import Ember from 'ember';

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

export default Ember.Object.extend({
  uploads: Ember.A(),
  base: function() {
    return "/"+ (this.get("config.media_folder") || "uploads");
  }.property("config.media_folder"),
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
  }
});