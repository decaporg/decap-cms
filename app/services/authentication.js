import Ember from 'ember';

export default Ember.Object.extend({
  authenticated: false,
  authenticate: function(repository, token) {
    repository.configure(this.get("config"), token);
    localStorage.setItem("cms.token", token);
    this.set("authenticated", true);
  },
  logout: function(repository) {
    repository.configure(this.get("config"), null);
    localStorage.removeItem("cms.token");
    this.set("authenticated", false);
  }
});
