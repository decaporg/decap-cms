import AuthenticatedRoute from '../authenticated';

export default AuthenticatedRoute.extend({
  model: function(params) {
    return this.get("config").findCollection(params.collection_id);
  },

  controllerName: "list",
  setupController: function(controller, model) {
    this._super();
    controller.prepare(model);
  },
  templateName: "collection"
});
