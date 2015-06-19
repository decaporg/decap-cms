import AuthenticatedRoute from '../authenticated';

export default AuthenticatedRoute.extend({
  model: function(/*params*/) {
    return this.get("config").collections[0];
  },
  afterModel: function(model /*, transition*/ ) {
    this.transitionTo("index.list", model);
  }
});
