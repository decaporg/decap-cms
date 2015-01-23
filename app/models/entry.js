import Ember from 'ember';
 /* global jsyaml */

function parseContent(content) {
  var regexp = /^---\n([^]*?)\n---\n([^]*)$/;
  var match = content.match(regexp);
  var item = jsyaml.safeLoad(match[1]);
  item.body = (match[2] || "").replace(/^\n+/, '');
  return item;
}

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
        excerpt = line;
      }
      return line;
    }
  }.property("body")
});

Entry.reopenClass({
  fromContent: function(collection, content, path) {
    return Entry.create(Ember.$.extend(parseContent(content), {_collection: collection, _path: path}));
  }
});

export default Entry;