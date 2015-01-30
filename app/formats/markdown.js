import Ember from 'ember';

export default Ember.Object.extend({
  extension: "md",
  fromFile: function(content) {
    var title = ((content || "").split("\n")[0] || "").replace(/^#+\s*/,'');
    return {title: title, body: content};
  },
  toFile: function(obj) {
    return obj.body;
  }
});