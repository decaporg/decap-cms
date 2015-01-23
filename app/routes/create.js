import AuthenticatedRoute from './authenticated';
import Entry from "../models/entry";

export default AuthenticatedRoute.extend({
  _slugify: function(text) {
     return text.toString().toLowerCase()
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
      .replace(/\-\-+/g, '-')         // Replace multiple - with single -
      .replace(/^-+/, '')             // Trim - from start of text
      .replace(/-+$/, '');            // Trim - from end of text
  },
  _generateSlug: function() {
    var date = new Date();
    return "" + date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + "-" + this._slugify(this.currentModel.entry.title);
  },
  
  model: function(params) {
    return this.get("config").findCollection(params.collection_id);
  },

  controllerName: "entry",
  
  setupController: function(controller, model) {
    this._super();
    controller.prepare(model, Entry.create({}));
  }
});
