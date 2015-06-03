import Ember from 'ember';

export default Ember.Controller.extend({
  templateName: "application",
  breadcrumbs: [{
    label: "Content",
    path: "index"
  }],
  collections: Ember.computed.alias("config.collections"),
  actions: {
    toggleCollections: function() {
      this.set("showCollections", !this.get("showCollections"));
    },
    toggleProfile: function() {
      this.set("showProfile", !this.get("showProfile"));
    },
    newEntry: function(collection) {
      this.set("showCollections", false);
      this.transitionToRoute("create", collection);
    }
  }
});
