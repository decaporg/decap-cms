import Ember from 'ember';
import Collection from './collection';
 /* global jsyaml */

var Entry = Ember.Object.extend({
  _collection: null,
  _generateContent: function() {
    var field;
    var content = "---\n";
    var meta = {};
    var collection = this._collection;
    for (var i=0, len=collection.fields.length; i<len; i++) {
      field = collection.fields[i];
      if (field.name !== "body") {
        meta[field.name] = field.getValue();
      }
      this[field.name] = field.getValue();
    }
    content += jsyaml.safeDump(meta);
    content += "---\n\n";
    content += this.body;
    return content;
  },
});

Entry.reopenClass({
  pathFor: function(collection, slug) {
    return collection.folder + "/" + slug + ".md";
  },
  parseContent: function(content) {
    var regexp = /^---\n([^]*?)\n---\n([^]*)$/;
    var match = content.match(regexp);
    var item = jsyaml.safeLoad(match[1]);
    item.body = (match[2] || "").replace(/^\n+/, '');
    return item;
  },
  getEntry: function(collection_id, slug) {
    var collection = Collection.find(collection_id);
    var path = Entry.pathFor(collection, slug);
    console.log(collection, path);
    // return Repository.readFile(path).then(function(content) {
    //   var entry = Entry.create($.extend(Entry.parseContent(content), {_collection: collection, _path: path}));
    //   collection.setEntry(entry);
    //   return entry;
    // }.bind(this));
  }
});

export default Entry;