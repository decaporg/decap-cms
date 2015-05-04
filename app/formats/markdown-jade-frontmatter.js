import MarkdownFrontmatterFormatter from "./markdown-frontmatter";
/* global jsyaml */

export default MarkdownFrontmatterFormatter.extend({
  extension: "jade",
  indent: function(content, indentation) {
    var indentedContent = [];
    var lines = content.split("\n");
    for (var i=0, len=lines.length; i<len; i++) {
      indentedContent.push(indentation + lines[i]);
    }
    return indentedContent.join("\n");
  },
  fromFile: function(content) {
    var line, lines, match;
    var markdown = null;
    var indentation = null;
    var obj = this._super(content);
    obj.jade_body = obj.body;

    lines = (obj.jade_body || "").split("\n");
    for (var i=0, len=lines.length; i<len; i++) {
      line = lines[i];
      if (markdown === null) {
        match = line.match(/^\s*:markdown\s*$/);
        if (match) {
          markdown = [];
        }
      } else {
        if (indentation === null) {
          match = line.match(/^(\s+)/);
          indentation = match[1];
        }
        if (line.indexOf(indentation) === 0 || line.match(/^\s*$/)) {
          markdown.push(line.substr(indentation.length) || "");
        } else {
          break;
        }
      }
    }

    if (obj.hasOwnProperty("title") === false) {
      obj.title = (markdown[0] || "").replace(/^#+\s*/, '');
    }

    obj.body = markdown ? markdown.join("\n") : null;

    return obj;
  },
  toFile: function(obj, entry) {
    var line, lines, match;
    var markdown = null;
    var done = null;
    var indentation = null;
    var body = [];
    var meta = {};
    var content = "";
    var originalContent = entry.get("cmsFileContent") || "";
    var bodyTpl = originalContent.replace(/^---\n([^]*?)\n---\n/, '') || ":markdown\n  ";

    for (var key in obj) {
      if (key !== "body") {
        meta[key] = obj[key];
      }
    }

    content += "---\n";
    content += jsyaml.safeDump(meta);
    content += "---\n\n";

    lines = bodyTpl.split("\n");
    for (var i=0, len=lines.length; i<len; i++) {
      line = lines[i];
      if (markdown === null || done) {
        body.push(line);
        match = done ? null : line.match(/^\s*:markdown\s*$/);
        if (match) {
          markdown = [];
        }
      } else {
        if (indentation === null) {
          match = line.match(/^(\s+)/);
          indentation = match[1];

        }
        if (line.indexOf(indentation) === 0) {
          // Ignore line
        } else {
          body.push(this.indent(obj.body || "", indentation));
          done = true;
        }
      }
    }
    if (markdown && !done) {
      body.push(this.indent(obj.body || "", indentation || "  "));
    }

    return content + body.join("\n");
  }
});
