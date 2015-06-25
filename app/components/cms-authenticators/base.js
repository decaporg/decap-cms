import Ember from 'ember';

export default Ember.Component.extend({
  tagName: "",

  authenticationErrorMessage: "Failed to authenticate",
  authorizationErrorMessage: "This user doesn't have permissions to edit this site.",

  // Error message set by the component if authentication fails (ie, user didn't
  // authenticate with github)
  authenticationError: false,
  // Error message set by the login route if the authorization fails (ie, this
  // github user doesn't have access to the repository)
  authorizationError: false,

  error: function() {
    if (this.get("authenticationError")) {
      return this.get("authenticationErrorMessage");
    } else if (this.get("authorizationError")) {
      return this.get("authorizationErrorMessage");
    }
  }.property("authenticationError", "authorizationError"),

  actions: {
    authenticate: function() {
      this.authenticate().then((data) => {
        this.set("authenticationError", false);
        this.sendAction("action", data);
      }).catch((err) => {
        this.set("authorizationError", err);
      });
    }
  }
});
