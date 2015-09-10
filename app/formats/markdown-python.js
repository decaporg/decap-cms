import MarkdownFormatter from "./markdown";
import YAML from "./yaml";

export default MarkdownFormatter.extend({
  extension: "md",
  fromFile: function(content) {
    var lines = content.split(/\n\r?/);
    var meta = [];
    var body = [];

    for (var i=0,len=lines.length; i<len; i++) {
      if (body.length === 0 && lines[i].match(/^\w+:.+/)) {
        meta.push(lines[i]);
      } else if (body.length || lines[i]) {
        body.push(lines[i]);
      }
    }

    var obj = meta.length ? YAML.create({}).fromFile(meta.join("\n")) : {};
    obj.body = body.length ? body.join("\n") : "";
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

    content += YAML.create({}).toFile(meta);
    content += "\n";
    content += body;
    return content;
  }
});
