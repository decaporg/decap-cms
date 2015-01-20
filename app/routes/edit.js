import Ember from 'ember';
import AuthenticatedRoute from './authenticated';
import Entry from '../models/entry';
 /* global jsyaml */


export default AuthenticatedRoute.extend({
  _pathFor: function(collection, slug) {
    return collection.folder + "/" + slug + ".md";
  },

  _parseContent: function(content) {
    var regexp = /^---\n([^]*?)\n---\n([^]*)$/;
    var match = content.match(regexp);
    var item = jsyaml.safeLoad(match[1]);
    item.body = (match[2] || "").replace(/^\n+/, '');
    return item;
  },

  model: function(params) {
    var collection = this.get("config").findCollection(params.collection_id);
    var path = this._pathFor(collection, params.slug);
    this.entryPath = path;
    this.collection = collection;
    return this.get("repository").readFile(path).then(function(content) {
      return Entry.create(Ember.$.extend(this._parseContent(content), {_collection: collection}));
    }.bind(this));
  },

  controllerName: "entry",
  setupController: function(controller, model, transition) {
    this._super();
    controller.set("entry", model);
    controller.set("collection", this.collection);
    controller.set("entryPath", this.entryPath);
  },

  cmsTemplateName: "entry",

  actions: {
    save: function() {
      console.log(this.get("controller").toFileContent());
      this.get("repository").updateFiles({
        files: [{path: this.entryPath, content: this.get("controller").toFileContent()}],
        message: "Updated " + this.get("controller.collection.label") + " " + this.get("controller.entry.title")
      }).then(function() {
        console.log("Done!");
      });
    }
  }
});
