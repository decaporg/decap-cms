import AuthenticatedRoute from './authenticated';
import Entry from '../models/entry';

export default AuthenticatedRoute.extend({
  _pathFor: function(collection, slug) {
    return collection.folder + "/" + slug + ".md";
  },

  serialize: function(model) {
    return {
      collection_id: model.get("_collection.id"),
      slug: (model.get("_path") || "").split("/").pop().replace(/\.[^.]+$/, '')
    };
  },

  model: function(params) {
    var collection = this.get("config").findCollection(params.collection_id);
    var path = this._pathFor(collection, params.slug);
    return this.get("repository").readFile(path).then(function(content) {
      return Entry.fromContent(collection, content, path);
    }.bind(this));
  },

  controllerName: "entry",
  setupController: function(controller, model) {
    this._super();
    this.collection = model._collection;
    controller.prepare(this.collection, model);
  },

  renderTemplate: function() {
    this.render("entry");
    this.render("entry-sidebar", {outlet: "sidebar"});
  },

  actions: {
    willTransition: function(transition) {
      if (this.controller.get("widgets").filter((w) => w.get("dirty")).length === 0) {
        return;
      }
      if (!confirm("Discard changes?")) {
        transition.abort();
      }
    }
  }

});
