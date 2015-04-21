import Ember from 'ember';

var Promise = Ember.RSVP.Promise;

export default Ember.Object.extend({
  prefix: "cms.cache",
  get: function(key) {
    var value = window.localStorage.getItem(this.prefix + "." + key);
    return value ? Promise.resolve(value) : Promise.reject();
  },
  set: function(key, value) {
    window.localStorage.setItem(this.prefix + "." + key, value);
    return Promise.resolve(value);
  }
});
