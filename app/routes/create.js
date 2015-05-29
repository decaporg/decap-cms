import AuthenticatedRoute from './authenticated';
import Entry from "../models/entry";

export default AuthenticatedRoute.extend({
  model: function(params) {
    return this.get("config").findCollection(params.collection_id);
  },

  controllerName: "entry",

  setupController: function(controller, model) {
    this._super();
    controller.prepare(model, Entry.create({_collection: model}));
  },

  templateName: "entry"
});
