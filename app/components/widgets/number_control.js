import Ember from 'ember';

/**
@module app
@submodule widgets
*/

/**
 Number input. For now only accepts integers.


 @class NumberControl
 @extends Ember.Component
 */
export default Ember.Component.extend({
  init: function() {
    this._super();
    this.get("widget").registerValidator(function(value) {
      return !isNaN(parseInt(value, 10));
    }.bind(this));

    this.set("value", this.get("widget.value"));
  },

  onDateStringChange: function() {
    var value = parseInt(this.get("value"), 10);
    if (isNaN(value)) {
      this.set("widget.value", null);
    } else {
      this.set("widget.value", value);
    }
  }.observes("value")
});
