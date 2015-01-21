import Ember from 'ember';
import Widget from './base';

export default Widget.extend({
  items: null,
  init: function() {
    this._super();
    this.set("items", Ember.A());
    this.set("validators", Ember.A());
  },
  getValue: function() {
    var value = [];
    this.get("items").forEach(function(item) {
      if (item.isEmpty()) { return; }
      value.push(item.get("value"));
    });
    return value;
  },
  isValid: function() {
    return this.get("items").every(function(item) {
      return item.isEmpty() || item.get("isValid");
    });
  }.property("items.@each.isValid"),
});