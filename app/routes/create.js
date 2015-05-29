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

  templateName: "entry",

  actions: {
    willTransition: function(transition) {
      console.log("Values: ", this.get("controller.widgets").map((w) => [w.get("value"), w.get("dirty")] ));
      if (this.get("controller.widgets").filter((w) => w.get("value") && w.get("dirty")).length === 0) {
        return;
      }
      if (!confirm("Discard changes?")) {
        transition.abort();
      }
    }
  }

});
