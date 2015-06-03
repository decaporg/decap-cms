import AuthenticatedRoute from '../authenticated';

export default AuthenticatedRoute.extend({
  model: function(params) {
    return this.get("config").collections[0];
  },
  actions: {
    activate: function(transition) {
      console.log("Hello");
      this.transitionTo("index.list", this.get("model"));
    }
  }
});
