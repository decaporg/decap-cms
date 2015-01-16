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
    return this.get("repository").readFile(path).then(function(content) {
      var entry = Entry.create(Ember.$.extend(this._parseContent(content), {_collection: collection, _path: path}));
      collection.setEntry(entry);
      return entry;
    }.bind(this));
  },

  actions: {
    save: function() {
      var entry = this.currentModel;
      console.log("Hmm, entry? %o", entry);
      var content = entry._generateContent();
      this.get("repository").updateFiles({
        files: [{path: entry._path, content: content}],
        message: "Updated " + entry._collection.label + " " + entry.title
      }).then(function() {
        console.log("Done!");
      });
    }
  }
});
