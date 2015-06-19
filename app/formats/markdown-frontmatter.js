import MarkdownFormatter from "./markdown";
/* global jsyaml */
/* global moment */


var MomentType = new jsyaml.Type('date', {
  kind: 'scalar',
  predicate: function(value) {
    return moment.isMoment(value);
  },
  represent: function(value) {
    return value.format(value._f);
  }
});

var OutputSchema = new jsyaml.Schema({
  include: jsyaml.DEFAULT_SAFE_SCHEMA.include,
  implicit: [MomentType].concat(jsyaml.DEFAULT_SAFE_SCHEMA.implicit),
  explicit: jsyaml.DEFAULT_SAFE_SCHEMA.explicit
});

export default MarkdownFormatter.extend({
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
    content += jsyaml.safeDump(meta, {schema: OutputSchema});
    content += "---\n\n";
    content += body;
    return content;
  }
});
