import Ember from 'ember';

export default Ember.View.extend({
  tagName: "",
  init: function() {
    this._super.apply(this, arguments);
    this.set("templateName", this.container.lookup("template:cms/" + this.renderedName) ? "cms/" + this.renderedName : this.renderedName);
  },
  templateName: null
});