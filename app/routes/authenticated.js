import Route from './cms';

export default Route.extend({
  authenticated: Ember.computed.alias("authentication.authenticated"),
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