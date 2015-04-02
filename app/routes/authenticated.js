import Ember from 'ember';
import Route from './cms';

export default Route.extend({
  authenticated: Ember.computed.alias("authentication.authenticated"),
  actions: {
    logout: function() {
      this.get("authentication").logout(this.get("repository"));
      this.transitionTo("login");
    }
  },
  beforeModel: function() {
    if (!this.get("authenticated")) {
      var token = localStorage.getItem("cms.token");
      if (token) {
        this.get("authentication").authenticate(this.get("repository"), token);
      } else {
        this.transitionTo("login");
      }
    }
  }
});
