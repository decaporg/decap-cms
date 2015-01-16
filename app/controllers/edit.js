import Ember from 'ember';

export default Ember.Controller.extend({
  collection: function() {
    return this.get("model._collection");
  }.property("model._collection"),
});