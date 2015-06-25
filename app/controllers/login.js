import Ember from 'ember';

export default Ember.Controller.extend({
  authorizationError: null,

  authenticator: function() {
    return "cms-authenticators/" + (this.get("config.backend.authenticator") || this.get("config.backend.name"));
  }.property("config.authenticator.name"),

  actions: {
    login: function(data) {
      this.get("repository").authorize(data).then(
        () => {
          this.get("authstore").store(data);
          this.transitionToRoute("index");
        },
        (err) => { this.set("controller.authorizationError", err); }
      );
    }
  }
});
