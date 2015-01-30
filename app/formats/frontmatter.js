import Ember from 'ember';
/* global jsyaml */

export default Ember.Object.extend({
  extension: "md",
  fromFile: function(content) {
    var regexp = /^---\n([^]*?)\n---\n([^]*)$/;
    var match = content.match(regexp);
    var obj = match ? jsyaml.safeLoad(match[1]) : {};
    obj.body = match ? (match[2] || "").replace(/^\n+/, '') : content;
    return obj;
  },
  toFile: function(data) {
    var meta = {};
    var body = "" ;
    var content = "";
    for (var key in data) {
      if (key === "body") {
        body = data[key];
      } else {
        meta[key] = data[key];
      }
    }

    content += "---\n";
    content += jsyaml.safeDump(meta);
    content += "---\n\n";
    content += body;
    return content;
  }
});