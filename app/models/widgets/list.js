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
      value.push(item.get("value"));
    });
    return value;
  }
});