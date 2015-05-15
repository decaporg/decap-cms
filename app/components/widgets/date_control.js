import Ember from 'ember';

/**
@module app
@submodule widgets
*/

/**
 Date input. Relies on the standard date input in browsers that supports it.

 Will make sure the entered value is a date.

 @class DateControl
 @extends Ember.Component
 */
export default Ember.Component.extend({
  init: function() {
    this._super();
    this.get("widget").registerValidator(function(value) {
      return !isNaN(value);
    }.bind(this));

    this.set("value", (this.get("widget.value") && this.get("widget.value").toString()));
  },

  onDateStringChange: function() {
     this.set("widget.value", new Date(this.get("value")));
  }.observes("value")
});
