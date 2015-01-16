import Ember from 'ember';

export default Ember.Component.extend({
  init: function() {
    this._super.apply(this, arguments);
    this.set("templateName", "widgets/" + this.field.get("widget"));
  }
});
