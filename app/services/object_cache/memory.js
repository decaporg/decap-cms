import Ember from 'ember';

var Promise = Ember.RSVP.Promise;

export default Ember.Object.extend({
  cache: {},
  get: function(key) {
    var value = this.cache[key];
    return value ? Promise.resolve(value) : Promise.reject();
  },
  set: function(key, value) {
    this.cache[key] = value;
    return Promise.resolve(value);
  }
});
