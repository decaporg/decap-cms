import Ember from 'ember';
import Collection from './collection';

export default Ember.Object.extend({
  init: function() {
    var collections = [];
    for (var i=0, len=this.collections.length; i<len; i++) {
      collections.push(Collection.create(this.collections[i]));
    }
    this.collections = collections;
  },
  findCollection: function(id) {
    return this.collections.filter(function(c) { return c.id === id; })[0];
  }
});
