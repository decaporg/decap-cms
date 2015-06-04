import Ember from 'ember';
/* global moment */

/**
@module app
@submodule widgets
*/

/**
 Datetime input.

 Will make sure the entered value is a datetime.

 @class DatetimeControl
 @extends Ember.Component
 */
export default Ember.Component.extend({
  init: function() {
    var date, time;
    this._super();
    this.get("widget").registerValidator(function(value) {
      return !isNaN(value);
    }.bind(this));

    var value = this.get("widget.value");
    if (value) {
      date = moment(value, this.get("format")).format(this.get("dateFormat"));
      time = moment(value, this.get("format")).format(this.get("timeFormat"));
    }

    this.set("time", time);
    this.set("date", date);
  },

  onDateStringChange: function() {
    var datetime = moment(this.get("datestring"), "YYYY-MM-DD hh:mma");
    if (this.get("time") == null) {
      this.set("time", datetime.format(this.get("timeFormat")));
    }
    this.set("widget.value", datetime);
  }.observes("date"),

  onTimeStringChange: function() {
    this.set("widget.value",  moment(this.get("datestring"), "YYYY-MM-DD hh:mma"));
  }.observes("time"),

  format: function() {
    return this.get("dateFormat") + " " + this.get("timeFormat");
  }.property("dateFormat", "timeFormat"),

  datestring: function() {
    var date = this.get("date"),
        ds;
    if (date) {
      ds =  date + " " + (this.get("time") || "");
      return ds;
    }
    return "";
  }.property("date", "time"),

  dateFormat: function() {
    var format = this.get("widget.field.date_format");
    return format ? format : "YYYY-MM-DD";
  }.property("widget.date_format"),

  timeFormat: function() {
    var format = this.get("widget.field.time_format");
    return format ? format : "hh:mma";
  }.property("widget.time_format")
});
