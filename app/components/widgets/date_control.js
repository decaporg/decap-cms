import Ember from 'ember';
/* global moment */

/**
@module app
@submodule widgets
*/

/**
 Date input.

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

    var value = this.get("widget.value");
    if (value && value instanceof Date) {
      value = moment(value).format(this.get("dateFormat"));
    }

    this.set("value", value);
  },

  onDateStringChange: function() {
    
    this.set("widget.value", moment(this.get("value")));
  }.observes("value"),

  dateFormat: function() {
    var format = this.get("widget.field.format");
    return format ? format : "YYYY-MM-DD";
  }.property("widget.format")
});
