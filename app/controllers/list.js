import Ember from 'ember';
import Entry from '../models/entry';

var EntriesController = Ember.ArrayController.extend({
  sortProperties: function() {
    var sortBy = this.get("collection.sort") || "title:asc";
    return [sortBy.split(":")[0]];
  }.property("collection.sort"),

  sortAscending: function() {
    var sortBy = this.get("collection.sort") || "title:asc";
    return sortBy.split(":")[1] === "asc";
  }.property("collection.sort")
});

export default Ember.Controller.extend({
  templateName: "entries",
  breadcrumbs: function() {
    return [{
      label: `${this.get("collection.label")} List`,
      path: "list",
      model: this.get("collection")
    }];
  }.property("collection"),
  needs: ['application'],
  prepare: function(collection) {
    this.set("collection", collection);
    this.set('controllers.application.currentAction', "Edit existing" + " " + this.get("collection.label"));
    this.set("entries", EntriesController.create({}));
  },

  onFiles: function() {
    var collection = this.get("collection");
    var repository = this.get("repository");
    this.set("loading_entries", true);
    this.set("entries.model", []);

    repository.listFiles(collection.folder).then(function(files) {

      files = files.filter(function(file) { return file.name.split(".").pop() === collection.getExtension(); }).map(function(file) {

        return repository.readFile(file.path, file.sha).then(function(content) {
          file.content = content;
          return file;
        }, function(err) {
          console.log("Error reading file :( %o", err);
        });
      });
      Ember.RSVP.Promise.all(files).then(function(files) {
        this.set("entries.collection", collection);
        this.set("entries.model", files.map(function(file) {
          return Entry.fromContent(collection, file.content, file.path);
        }));
        this.set("loading_entries", false);
      }.bind(this));
    }.bind(this));
  }.observes("entries")
});
