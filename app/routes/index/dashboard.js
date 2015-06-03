import AuthenticatedRoute from '../authenticated';

export default AuthenticatedRoute.extend({
  model: function(params) {
    return this.get("config").collections[0];
  },
  afterModel: function(model, transition) {
    console.log("Hello %o", model);
    this.transitionTo("index.list", model);
  }
});
