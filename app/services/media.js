import Ember from 'ember';
import {urlify} from '../utils/slugify';

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
  publicPath: null,
  src: null,
  base64: function() {
    return this.src && this.src.split(",").pop();
  }
});

function normalize(path) {
  return (path || "").split("/").map(function(el) { return urlify(el); }).join("/");
}

/**
  Media service is a global media handler.

  This service is used to upload new files to the CMS. When a commit is made,
  these files will be included and added to the repository.

  @class Media
  @extends Ember.Object
*/

export default Ember.Object.extend({
  uploads: Ember.A(),
  uploaded: Ember.A(),
  add: function(path, file) {
    path = normalize(path);
    var name = path.split("/").pop();

    this.remove(path);
    return new Promise((resolve,reject) => {
      var reader = new FileReader();
      reader.onload = () => {
        var mediaFile = MediaFile.create({
          name: name,
          size: file.size,
          path: path,
          publicPath: this.publicPathFor(path),
          src: reader.result
        });
        this.uploads.pushObject(mediaFile);
        resolve(mediaFile);
      };
      reader.onerror = function() {
        reject("Unable to read file");
      };
      reader.readAsDataURL(file);
    });
  },
  find: function(path) {
    var upload = this.get("uploads").find((mediaFile) => mediaFile.path === path.replace(/^\//, ''));
    return upload || this.get("uploaded").find((mediaFile) => mediaFile.path === path.replace(/^\//, ''));
  },
  remove: function(path) {
    this.set("uploads", this.get("uploads").reject((mediaFile) => path === mediaFile.path ));
  },
  reset: function() {
    this.set("uploaded", this.get("uploaded").concat(this.get("uploads")));
    this.set("uploads", Ember.A());
    return true;
  },
  srcFor: function(path) {
    var base = this.get("config.public_folder");
    var mediaFile = this.find(base ? base + path : path);
    return mediaFile ? mediaFile.src : path;
  },
  publicPathFor: function(path) {
    var base = this.get("config.public_folder");
    return base ? path.replace(new RegExp("^/?" + base + "/"), '/') : "/" + path;
  }
});
