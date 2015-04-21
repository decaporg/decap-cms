import Ember from 'ember';

var Promise = Ember.RSVP.Promise;

export default Ember.Object.extend({
  db: "cms.cache",
  objectStore: "cms.cache",
  withDB: function() {
    return new Promise(function(resolve,reject) {
      var request = window.indexedDB.open(this.db,1);
      request.onerror = reject;
      request.onsuccess = function() {
        resolve(request.result);
      };
      request.onupgradeneeded = function(event) {
        var db = event.target.result;
        try {
          db.createObjectStore(this.objectStore, {keyPath: "key"});
        } catch(e) {
          console.log("Object store creation failed: %o", e);
        }
      }.bind(this);
    }.bind(this));
  },
  withObjectStore: function(write) {
    return new Promise(function(resolve, reject) {
      this.withDB().then(function(db) {
        var transaction = db.transaction([this.objectStore], write ? 'readwrite' : 'readonly');
        var objectStore = transaction.objectStore(this.objectStore);
        resolve(objectStore);
      }.bind(this), reject);
    }.bind(this));
  },
  get: function(key) {
    return new Promise(function(resolve, reject) {
      this.withObjectStore().then(function(objectStore) {
        var request = objectStore.get(key);
        request.onerror = reject;
        request.onsuccess = function() {
          if (request.result) {
            resolve(request.result.value);
          } else {
            reject();
          }
        };
      }, reject);
    }.bind(this));
  },
  set: function(key, value) {
    return new Promise(function(resolve, reject) {
      this.withObjectStore(true).then(function(objectStore) {
        var request = objectStore.add({key: key, value: value});
        request.onerror = reject;
        request.onsuccess = function() {
          resolve(value);
        };
      });
    }.bind(this));
  }
});
