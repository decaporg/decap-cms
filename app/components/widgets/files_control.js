import Ember from 'ember';

/**
@module app
@submodule widgets
*/

/**
 Files input. Gives the user a dropzone for multiple files.

 The value of the field will be set to an array of {label, path} objects

 @class FilesControl
 @extends Ember.Component
 */
export default Ember.Component.extend({
  init: function() {
    this._super();
    this.set("uploads", Ember.A());
    if (!this.get("widget.value")) {
      this.set("widget.value", Ember.A());
    }
  },
  actions: {
    fileUpload: function(files) {
      var file;
      var media = this.get("media");
      var field = this.get("widget.field");
      for (var i=0,len=files.length; i<len; i ++) {
        file = files[i];
        media.add("/" + (field.folder || "uploads") + "/" + file.name, file).then((mediaFile) => {
          this.get("widget.value").pushObject({label: mediaFile.name, path: mediaFile.path});
        });
      }
    },
    reorder: function(files) {
      this.set("widget.value", files);
    }
  }
});
