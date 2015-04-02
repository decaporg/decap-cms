import Ember from 'ember';

var Entry = Ember.Object.extend({
  cmsExcerpt: function() {
    var line, lines;
    var excerpt = this.excerpt || this.description;
    if (excerpt) {
      return excerpt;
    } else {
      lines = (this.body || "").split("\n");
      while (!excerpt && lines.length) {
        line = lines.shift();
        if (line.indexOf("#") === 0 || line.indexOf(">") === 0) {
          continue;
        }
        if (lines[0] && lines[0].match(/^(-+|=+)$/)) {
          lines.shift();
          continue;
        }
        excerpt = line.trim();
      }
      return line;
    }
  }.property("body"),
  dateFromUrl: function() {
    // TODO: check collection.entry_path to figure out if we have date parts in the url
    var name = this._path.split("/").pop();
    var match = name.match(/^(\d\d\d\d-\d\d-\d\d)-/);
    if (match) {
      return new Date(match[1]);
    }
  }.property("_path")
});

Entry.reopenClass({
  fromContent: function(collection, content, path) {
    return Entry.create(Ember.$.extend(collection.formatter.fromFile(content), {_collection: collection, _path: path, _file_content: content}));
  }
});

export default Entry;
