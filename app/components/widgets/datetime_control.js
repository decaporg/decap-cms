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
    var datetime, date, time;
    this._super();

    var value = this.get("widget.value");
    if (value) {
      console.log("Casting value %s - %s", value, this.get("format"));
      datetime = moment(value, this.get("format"));
      this.set("widget.value", datetime);
      date = datetime.format(this.get("dateFormat"));
      time = datetime.format(this.get("timeFormat"));
    }

    console.log("Set time: %v", time);
    console.log("Set date: %v", date)
    this.set("time", time);
    this.set("date", date);
  },

  onDateStringChange: function() {
    var datetime = moment(this.get("datestring"), this.get("format"));
    if (this.get("time") == null) {
      this.set("time", datetime.format(this.get("timeFormat")));
    }
    this.set("widget.value", datetime);
  }.observes("date"),

  onTimeStringChange: function() {
    this.set("widget.value",  moment(this.get("datestring"), this.get("format")));
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
    var format = this.get("widget.field.dateFormat");
    return format ? format : "YYYY-MM-DD";
  }.property("widget.date_format"),

  timeFormat: function() {
    var format = this.get("widget.field.timeFormat");
    return format ? format : "hh:mma";
  }.property("widget.timeFormat")
});
