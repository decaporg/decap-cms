import Ember from 'ember';

export default Ember.Controller.extend({
  init: function() {
    this._super.apply(this, arguments);
    Ember.$(document).ajaxError((event, jqXHR, ajaxSettings, thrownError) => {
      // You should include additional conditions to the if statement so that this
      // only triggers when you're absolutely certain it should
      if (jqXHR.status === 401) {
        this.set("showLoginModal", true);
      }
    });
  },
  showLoginModal: false,
  authorizationError: null,
  authenticator: function() {
    return "cms-authenticators/" + (this.get("config.backend.authenticator") || this.get("config.backend.name"));
  }.property("config.authenticator.name"),
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
    },
    login: function(data) {
      this.get("repository").authorize(data).then(
        () => {
          this.get("authstore").store(data);
          if (this.get("showLoginModal")) {
            this.set("showLoginModal", false);
          } else {
            this.transitionToRoute("index");
          }
        },
        (err) => { this.set("controller.authorizationError", err); }
      );
    }
  }
});
