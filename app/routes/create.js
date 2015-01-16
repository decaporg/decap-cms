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
    var date = new Date;
    return "" + date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + "-" + this._slugify(this.currentModel.entry.title);
  },
  afterModel: function(model) {
    model.setEntry(Entry.create({_collection: model}));
  },
  model: function(params) {
    return this.get("config").findCollection(params.collection_id);
  },

  actions: {
    save: function() {
      var collection = this.currentModel;
      var content = collection.entry._generateContent();
      var slug = this._generateSlug();
      
      this.get("repository").updateFiles({
        files: [{path: collection.folder + "/" + slug + ".md", content: content}],
        message: "Created " + collection.label + " " + collection.entry.title
      }).then(function() {
        console.log("Done!");
      }.bind(this));
    }
  }
});
