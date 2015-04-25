import Ember from 'ember';

export default Ember.Object.extend({
  extension: "md",
  fromFile: function(content) {
    var title = ((content || "").split("\n")[0] || "").replace(/^#+\s*/,'');
    return {title: title, body: content};
  },
  toFile: function(obj) {
    return obj.body;
  },
  excerpt: function(content) {
    var excerpt = "";
    var line = null;
    var lines = (content).split("\n");
    while (!excerpt && lines.length) {
      line = lines.shift();
      // Skip Markdown headers (this should be specific to the format)
      if (line.indexOf("#") === 0 || line.indexOf(">") === 0) {
        continue;
      }
      // Skip markdown headers or hrs (this should be specific to the format)
      if (lines[0] && lines[0].match(/^(-+|=+)$/)) {
        lines.shift();
        continue;
      }
      excerpt = line.trim();
    }
    return line;
  }
});
