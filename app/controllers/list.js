import Ember from 'ember';
import Entry from '../models/entry';

export default Ember.Controller.extend({
  needs: ['application'],
  prepare: function(collection) {
    this.set("collection", collection);
    this.set('controllers.application.currentAction', "Edit existing" + " " + this.get("collection.label"));
  },

  onFiles: function() {
    var collection = this.get("collection");
    var repository = this.get("repository");
    this.set("loading_entries", true);
    this.set("entries", []);
    repository.readFiles(collection.folder).then(function(files) {
      files = files.filter(function(file) { return file.name.split(".").pop() === "md"; }).map(function(file) {
        return repository.readFile(file.path, file.sha).then(function(content) { 
          file.content = content;
          return file;
        });
      });
      Ember.RSVP.Promise.all(files).then(function(files) {
        this.set("entries", files.map(function(file) { 
          return Entry.fromContent(collection, file.content, file.path);
        }));
        this.set("loading_entries", false);
      }.bind(this));
    }.bind(this));
  }.observes("collection")
});