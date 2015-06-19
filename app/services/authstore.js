import Ember from 'ember';

export default Ember.Object.extend({
  store: function(data) {
    if (window.localStorage) {
      window.localStorage.setItem('cms.credentials', JSON.stringify(data));
    }
  },
  stored: function() {
    if (window.localStorage) {
      var stored = window.localStorage.getItem('cms.credentials');
      return stored && JSON.parse(stored);
    }
  },
  clear: function() {
    if (window.localStorage) {
      window.localStorage.removeItem('cms.credentials');
    }
  }
});
