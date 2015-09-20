import Ember from 'ember';
import Widget from './widget';


/* A single item in a list or in an object widget */
export default Ember.Object.extend({
  init: function() {
    var widgets = [];
    this._super.apply(this, arguments);
    this.set("_collection", this.get("widget.collection"));
    var value = this.get("value");
    (this.get("widget.field.fields") || []).forEach((field) => {
      widgets.push(Widget.create({
        field: field,
        value: value && value[field.name],
        entry: this
      }));
    });
    this.set("widgets", widgets);

    // Make sure the initial setup of the value gets registered
    this.valueDidChange();
  },
  id: null,
  widgets: null,
  isValid: function() {
    return this.get("widgets").every(function(widget) { return widget.get("isValid"); });
  },
  isEmpty: function() {
    return this.get("widgets").every(function(widget) { return !widget.get("value"); });
  },
  valueDidChange: function() {
    var value = {};
    this.get("widgets").forEach((widget) => {
      value[widget.get("name")] = widget.getValue();
      this.set(widget.get("name"), widget.getValue());
    });
    this.set("value", value);
  }.observes("widgets.@each.value"),

  cmsFirstField: function() {
    var widget = this.get("widgets")[0];
    var v = widget && widget.getValue();
    return ("" + v).substr(0,50);
  }.property("widgets.@each.value")
});
