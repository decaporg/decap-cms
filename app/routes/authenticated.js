import Ember from 'ember';
import Route from './cms';

export default Route.extend({
  authenticated: Ember.computed.alias("authentication.authenticated"),
  actions: {
    logout: function() {
      this.get("authstore").clear();
      this.get("repository").reset();
      this.transitionTo("login");
    }
  },
  beforeModel: function() {
    if (!this.get("authenticated")) {
      var credentials = this.get("authstore").stored();
      if (credentials) {
        this.get("repository").authorize(credentials).then(() => {}, (err) => {
          this.get("authstore").clear();
          this.transitionTo("login");
        });
      } else {
        this.transitionTo("login");
      }
    }
  }
});
