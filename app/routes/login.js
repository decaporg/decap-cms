import Ember from 'ember';
 /* global netlify */


export default Ember.Route.extend({
  actions: {
    login: function() {
      netlify.configure({site_id: 'timespace.netlify.com'});
      netlify.authenticate({provider: "github", scope: "repo"}, function(err, data) {
        if (err) {
          //this.controller.set("error", err);
          console.log(this);
        } else {
          localStorage.setItem("cms.token", data.token);
          this.get("authentication").authenticate(this.get("repository"), data.token);
          this.transitionTo("home");
        }
      }.bind(this));
    }
  }
});