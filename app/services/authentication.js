import Ember from 'ember';

export default Ember.Object.extend({
  authenticated: false,
  authenticate: function(repository, token) {
    repository.configure(this.get("config"), {github_access_token: token});
    localStorage.setItem("cms.token", token);
    this.set("authenticated", true);
  },
  logout: function(repository) {
    repository.reset();
    localStorage.removeItem("cms.token");
    this.set("authenticated", false);
  }
});
