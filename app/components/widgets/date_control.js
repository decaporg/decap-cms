import Ember from 'ember';

export default Ember.Component.extend({
  init: function() {
    this._super();
    this.widget.registerValidator(function(value) {
      return !isNaN(value);
    }.bind(this));
    
    this.set("value", (this.get("widget.value") && this.get("widget.value").toString()));
  },

  onDateStringChange: function() {
     this.set("widget.value", new Date(this.get("value")));
  }.observes("value")
});