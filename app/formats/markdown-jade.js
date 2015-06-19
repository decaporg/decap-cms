import MarkdownFormatter from "./markdown";

export default MarkdownFormatter.extend({
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
    var obj = {};

    lines = (content || "").split("\n");
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

    obj.title = (markdown[0] || "").replace(/^#+\s*/, '');
    obj.body = markdown ? markdown.join("\n") : null;

    return obj;
  },
  toFile: function(obj, entry) {
    var line, lines, match;
    var markdown = null;
    var done = null;
    var indentation = null;
    var body = [];
    var originalContent = entry.get("cmsFileContent") || "";
    var bodyTpl = originalContent.replace(/^---\n([^]*?)\n---\n/, '') || ":markdown\n  ";

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

    return body.join("\n");
  }
});
