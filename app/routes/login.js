import Route from './cms';
 /* global netlify */


export default Route.extend({
  actions: {
    login: function() {
      var config = this.get("config");
      this.get("authenticator").authenticate(this.get("config")).then(
        (data) => {
          this.get("repository").authorize(data).then(
            () => {
              this.get("authstore").store(data);
              this.transitionTo("index");
            },
            (err) => { this.set("controller.error", err); }
          );
        },
        (err) => {
          this.set("controller.error", err);
        }
      );
    }
  }
});
