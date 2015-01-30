import Ember from 'ember';
import Collection from './collection';


export default Ember.Object.extend({
  init: function() {
    var collection;
    var collections = [];
    for (var i=0, len=this.collections.length; i<len; i++) {
      var collection = Collection.create(this.collections[i]);
      collection.set("formatter", this.container.lookup("format:" + collection.get("format")));
      collections.push(collection);
    }
    this.collections = collections;
  },
  findCollection: function(id) {
    return this.collections.filter(function(c) { return c.id === id; })[0];
  }
});
