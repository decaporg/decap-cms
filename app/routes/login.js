import Route from './cms';
 /* global netlify */


export default Route.extend({
  actions: {
    login: function() {
      netlify.configure({site_id: 'timespace.netlify.com'});
      netlify.authenticate({provider: "github", scope: "repo"}, function(err, data) {
        if (err) {
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