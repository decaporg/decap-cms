import Ember from 'ember';
import Collection from './collection';

/**
@module app
@submodule models
*/

/**
 The CMS configuration

 @class Config
 @extends Ember.Object
 */

export default Ember.Object.extend({
  /*
    Instantiate all the collections
  */
  init: function() {
    var collection;
    var collections = [];
    for (var i=0, len=this.collections.length; i<len; i++) {
      collection = Collection.create(this.collections[i]);
      collection.set("config", this);
      collections.push(collection);
    }
    this.collections = collections;
  },

  ready: false,

  container: null,

  /**
    Find the collection matching the `id`

    @method findCollection
    @param {String} id
    @return {Collection} collection
  */
  findCollection: function(id) {
    return this.collections.filter(function(c) { return c.id === id; })[0];
  }
});
