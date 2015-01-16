import Ember from 'ember';

export default Ember.Object.extend({
  value: null,
  getValue: function() {
    return this.get("value") || null;
  }
});