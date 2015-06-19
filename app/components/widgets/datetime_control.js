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
  dateFormat: "YYYY-MM-DD",
  timeFormat: "hh:mma",

  init: function() {
    var date, time, datetime;
    this._super();

    var value = this.get("widget.value");
    if (value) {
      if (typeof value === 'object') {
        datetime = moment(value);
        datetime._f = this.get("format");
      } else {
        datetime = moment(value, this.get("format"));
      }

      date = datetime.format(this.get("dateFormat"));
      time = datetime.format(this.get("timeFormat"));
    }

    this.set("time", time);
    this.set("date", date);
  },

  onDateStringChange: function() {
    var datetime = moment(this.get("datestring"), "YYYY-MM-DD hh:mma");
    if (this.get("time") == null) {
      this.set("time", datetime.format(this.get("timeFormat")));
    }
    datetime._f = this.get("format");
    this.set("widget.value", datetime);
  }.observes("date"),

  onTimeStringChange: function() {
    var datetime = moment(this.get("datestring"), "YYYY-MM-DD hh:mma");
    datetime._f = this.get("format");
    this.set("widget.value", datetime);
  }.observes("time"),

  format: function() {
    return this.get("widget.field.format");
  }.property("widget.field.format"),

  datestring: function() {
    var date = this.get("date"),
        ds;
    if (date) {
      ds =  date + " " + (this.get("time") || "");
      return ds;
    }
    return "";
  }.property("date", "time")
});
