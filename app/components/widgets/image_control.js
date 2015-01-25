import Ember from 'ember';

export default Ember.Component.extend({
  init: function() {
    this._super();
    this.widget.set("src", this.widget.get("value"));
  },
  actions: {
    fileUpload: function(files) {
      var file = files[0];
      var media = this.get("media");
      media.add("/" + (this.widget.get("field.folder") || "uploads") + "/" + file.name, file).then(function(mediaFile) {
        this.widget.set("value", mediaFile.path);
        this.widget.set("src", mediaFile.src);
      }.bind(this));
    }
  }
});