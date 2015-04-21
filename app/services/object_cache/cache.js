import Ember from 'ember';
import IndexedDBCache from './indexed_db';
import LocalStorageCache from './local_storage';
import MemoryCache from './memory';

export default Ember.Object.extend({
  init: function() {
    this._super();
    if (window.indexedDB) {
      this.cache = IndexedDBCache.create({});
    } else if (window.localStorage) {
      this.cache = LocalStorageCache.create({});
    } else {
      this.cache = MemoryCache.create({});
    }
  },
  get: function(key) { return this.cache.get(key); },
  set: function(key, value) { return this.cache.set(key, value); }
});
