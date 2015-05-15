import Ember from 'ember';
/**
@module app
@submodule widgets
*/

/**
 A single image. This widget gives the user a dropzone for an image.

 The value of the field will be set to the path of the image.

 @class ImageControl
 @extends Ember.Component
 */
export default Ember.Component.extend({
  init: function() {
    this._super();
    this.set("widget.src", this.get("widget.value"));
  },
  actions: {
    fileUpload: function(files) {
      var file = files[0];
      var media = this.get("media");
      media.add("/" + (this.get("widget.field.folder") || "uploads") + "/" + file.name, file).then(function(mediaFile) {
        this.set("widget.value", mediaFile.path);
        this.set("widget.src", mediaFile.src);
      }.bind(this));
    }
  }
});
