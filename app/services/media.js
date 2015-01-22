import Ember from 'ember';

var Promise = Ember.RSVP.Promise;

var MediaFile = Ember.Object.extend({
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
  add: function(path, file) {
    return new Promise(function(resolve,reject) {
      var reader = new FileReader();
      reader.onload = function() {
        var mediaFile = MediaFile.create({
          name: file.name,
          size: file.size,
          path: path,
          src: reader.result
        });
        console.log("Added file to uploads: %o", mediaFile);
        this.uploads.pushObject(mediaFile);
        resolve(mediaFile);
      }.bind(this);
      reader.onerror = function() {
        reject("Unable to read file");
      };
      console.log("Reading: %o", file);
      reader.readAsDataURL(file);
    }.bind(this));
  },
  remove: function(path) {
    this.set("uploads", this.get("uploads").reject(function(mediaFile) { return path === mediaFile.path; }));
  }
});