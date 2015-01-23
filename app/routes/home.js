import AuthenticatedRoute from './authenticated';

export default AuthenticatedRoute.extend({
  model: function() {
    return this.get("config");
  },
  setupController: function(controller, model) {
    controller.prepare(model);
  }
});
