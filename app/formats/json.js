import Ember from 'ember';

export default Ember.Object.extend({
  extension: "json",
  fromFile: function(content) {
    return JSON.parse(content);
  },
  toFile: function(data) {
    return JSON.stringify(data);
  },
  excerpt: function() {
    return "A JSON Document";
  }
});
