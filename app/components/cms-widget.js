import Ember from 'ember';

export default Ember.Component.extend({
  tagName: "",
  init: function() {
    this._super.apply(this, arguments);
    console.log("Initializing widget for %o - %o", this.field, this.entry);
    this.set("templateName", this.container.lookup("template:cms/components/widget") ? "cms/components/widget" : "components/widget");
  }
});