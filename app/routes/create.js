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
    var collection = this.get("config").findCollection(params.collection_id);
    return collection;
  },
  controllerName: "entry",
  setupController: function(controller, model) {
    this._super();
    controller.set("entry", Entry.create({}));
    console.log("Setting collection to %o", model);
    controller.set("collection", model);
  },

  templateName: "entry",

  actions: {
    save: function() {
      var slug = this._generateSlug();
      this.get("repository").updateFiles({
        files: [{path: collection.folder + "/" + slug + ".md", content: this.get("controller").toFileContent()}],
        message: "Updated " + this.get("controller.collection.label") + " " + this.get("controller.entry.title")
      }).then(function() {
        console.log("Done!");
      });
    }
  }
});
