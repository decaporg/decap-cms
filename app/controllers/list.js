import Ember from 'ember';

export default Ember.Controller.extend({
  templateName: "entries",
  breadcrumbs: function() {
    return [{
      label: `${this.get("collection.label")} List`,
      path: "index.list",
      model: this.get("collection")
    }];
  }.property("collection"),
  needs: ['application'],
  prepare: function(collection) {
    this.set("collection", collection);
  },
  loadEntries: function() {
    this.set("loading_entries", true);
    this.get("collection").loadEntries().then((entries) => {
      this.set("entries", entries);
      this.set("loading_entries", false);
    });
  }.observes("collection")
});
