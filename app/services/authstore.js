import Ember from 'ember';

export default Ember.Object.extend({
  store: function(data) {
    window.localStorage && window.localStorage.setItem('cms.credentials', JSON.stringify(data));
  },
  stored: function() {
    var stored = window.localStorage && window.localStorage.getItem('cms.credentials');
    return stored && JSON.parse(stored);
  },
  clear: function(data) {
    window.localStorage && window.localStorage.removeItem('cms.credentials');
  }
});
