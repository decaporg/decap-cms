import Ember from 'ember';

//var MAX_SIZE = 1048576; // 10 MB

export default Ember.Component.extend({
  init: function() {
    this._super();
    this.set("uploads", Ember.A());
    if (!this.get("widget.value")) {
      this.widget.set("value", Ember.A());
    }
  },
  actions: {
    fileUpload: function(files) {
      var file;
      var media = this.get("media");
      var field = this.get("widget.field");
      for (var i=0,len=files.length; i<len; i ++) {
        file = files[i];
        media.add("/" + (field.folder || "uploads") + "/" + file.name, file).then(function(mediaFile) {
          this.widget.get("value").pushObject({label: mediaFile.name, path: mediaFile.path});
        }.bind(this));
      }
    },
    reorder: function(files) {
      this.set("widget.value", files);
    }
  }
});