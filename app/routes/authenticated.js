import Route from './cms';

export default Route.extend({
  actions: {
    logout: function() {
      this.get("authstore").clear();
      this.get("repository").reset(this.get("config"));
      this.transitionTo("login");
    }
  },
  beforeModel: function() {
    var credentials = this.get("authstore").stored();
    if (credentials) {
      this.get("repository").authorize(credentials).then(() => {}, (err) => {
        console.log("Authentication error: %o", err);
        this.get("authstore").clear();
        this.transitionTo("login");
      });
    } else {
      this.transitionTo("login");
    }
  }
});
