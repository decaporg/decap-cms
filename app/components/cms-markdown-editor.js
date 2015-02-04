import Ember from 'ember';
/* global HTMLParser */

var selfClosing = {
  img: true,
  hr: true,
  br: true
};

class Node {
  constructor(node) {
    this.node = node;
  }
  render() {
    return (this.node.text || "").replace(/\n/g, '').replace(/(&nbsp;)+/g, ' ');
  }
}

class Root extends Node {
  render() {
    var result = "";
    for (var i=0, len=this.node.children.length; i<len; i++) {
      result += this.node.children[i].render();
    }
    return result;
  }
}

class Tag extends Root {
  render() {
    var innerHTML = super();
    if (!selfClosing[this.node.tagName] && innerHTML.trim() === "") {
      return "";
    }
    switch(this.node.tagName) {
      case "strong":
      case "b":
        return `**${innerHTML}**`;
      case "em":
      case "i":
        return `_${innerHTML}_`;
      case "a":
        return `[${innerHTML}](${this.node.attrs.href})`;
      case "img":
        return `![${this.node.attrs.alt || ''}](${this.node.attrs.src})`;
      case "hr":
        return `--------`;
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6":
        return `${this.headerPrefix(this.node.tagName)} ${innerHTML}\n\n`;
      case "div":
        return `${innerHTML}\n\n`;
      case "p":
        return `${innerHTML}\n\n`;
      case "li":
        return `* ${innerHTML}\n`;
      case "br":
        return `  \n`;
    }
    return super();
  }
  headerPrefix(tagName) {
    var count = parseInt(tagName.substr(1), 10);
    var prefix = "";
    for (var i=0; i<count; i++) {
      prefix += "#";
    }
    return prefix;
  }
}

class HTMLHandler {
  constructor() {
    this.stack = [{tagName: "html", children: []}];
    this.current = this.stack[0];
  }
  start(tagName, attrs, unary) {
    this.stack.push({tagName: tagName, attrs: this.attrsFor(attrs), children: []});
    this.current = this.stack[this.stack.length - 1];
    if (unary) {
      this.end(tagName);
    }
  }
  end() {
    var newNode = new Tag(this.current);
    this.stack.pop();
    this.current = this.stack[this.stack.length - 1];
    this.current.children.push(newNode);
  }
  chars(text) {
    this.current.children.push(new Node({text: text}));
  }
  attrsFor(attrs) {
    var obj = {};
    attrs.forEach((attr) => {
      obj[attr.name] = attr.value;
    });
    return obj;
  }
  getText() {
    return new Root(this.current).render().replace(/\n\n\n+/g, "\n\n");
  }
}

export default Ember.Component.extend({
  cleanupPaste: function(html) {
    var handler = new HTMLHandler();
    try {
      new HTMLParser(html, handler);
    } catch (e) {
      console.log("Error cleaning HTML: %o", e);
      return html;
    }

    return handler.getText();
  },
  tagName: "div",
  showLinkbox: false,
  linkUrl: null,
  _getAbsoluteLinkUrl: function() {
    var url = this.get("linkUrl");
    if (url.indexOf("/") === 0) { return url; }
    if (url.match(/^https?:\/\//)) { return url; }
    if (url.match(/^mailto:/)) { return url; }
    if (url.match(/@/)) { return `mailto:${url}`; }
    return `http://${url}`;
  },
  _getSelection: function() {
    var textarea = this.$("textarea")[0],
        start = textarea.selectionStart,
        end   = textarea.selectionEnd;
    return {start: start, end: end, selected: (this.get("value") || "").substr(start, end-start)};
  },
  _setSelection: function(selection) {
    setTimeout(() => {
      var textarea = this.$("textarea")[0];
      textarea.focus();
      textarea.selectionStart = selection.start;
      textarea.selectionEnd = selection.end;
    }, 0);
  },
  _surroundSelection: function(chars) {
    var selection = this._getSelection(),
        value = this.get("value") || "",
        changed = chars + selection.selected + chars,
        escapedChars = chars.replace(/\*/g, '\\*'),
        regexp = new RegExp("^" + escapedChars + ".+" + escapedChars + "$");

    if (regexp.test(selection.selected)) {
      changed = selection.selected.substr(chars.length,selection.selected.length - (chars.length * 2));
    } else if (value.substr(selection.start-chars.length,chars.length) === chars && value.substr(selection.end, chars.length) === chars) {
      selection.start = selection.start - chars.length;
      selection.end = selection.end+chars.length;
      changed = selection.selected;
    }
    
    var before = value.substr(0,selection.start),
        after  = value.substr(selection.end);

    this.set("value", before + changed + after);

    this._setSelection(selection);
  },

  linkToFiles: function(files) {
    var media = this.get("media");
    var mediaFiles = [];
    for (var i=0, len=files.length; i<len; i++) {
      mediaFiles.push(media.add(`${this.media.get("base")}/${files[i].name}` , files[i]));
    }
    return new Ember.RSVP.Promise(function(resolve) {
      var file, image;
      var links = [];
      Ember.RSVP.Promise.all(mediaFiles).then(function(mediaFiles) {
        for (var i=0, len=mediaFiles.length; i < len; i++) {
          file = mediaFiles[i];
          image = file.name.match(/\.(gif|jpg|jpeg|png|svg)$/);          
          links.push(`${image ? '!' : ''}[${file.name}](${file.path})`);
        }
        resolve(links.join("\n"));
      });
    });
  },

  didInsertElement: function() {
    this.$("textarea").on("dragenter", function(e) {
      e.preventDefault();
    });
    this.$("textarea").on("dragover", function(e) {
      e.preventDefault();
    });
    this.$("textarea").on("drop", function(e) {
      e.preventDefault();
      var data;

      if (e.originalEvent.dataTransfer.files && e.originalEvent.dataTransfer.files.length) {
        data = this.linkToFiles(e.originalEvent.dataTransfer.files);
      } else {
        data = Ember.RSVP.Promise.resolve(e.originalEvent.dataTransfer.getData("text/plain"));
      }
      data.then(function(text) {
        var selection = this._getSelection();
        var value = this.get("value") || "";

        this.set("value", value.substr(0,selection.start) + text + value.substr(selection.end));
      }.bind(this));
    }.bind(this));
    this.$("textarea").on("keydown", function(e) {
      var selection = this._getSelection();
      if((e.ctrlKey || e.metaKey) && e.keyCode === 0x56) {
        var div = document.createElement("div");
        var handled = false;
        div.contentEditable = true;
        div.setAttribute("style", "opacity: 0; overflow: hidden; width: 1px; height: 1px; position: absolute; top: 0; left: 0;");
        document.body.appendChild(div);
        Ember.$(div).on("paste", (e) => {
          var transfer = e.originalEvent.clipboardData;
          // Make sure we don't handle plain text pasting as HTML
          if (transfer.types.length === 1) {
            e.preventDefault();
            var value = this.get("value") || "";
            var before = value.substr(0, selection.start);
            var middle = transfer.getData(transfer.types[0]);
            var after = value.substr(selection.end);
            this.set("value", before + middle + after);
            handled = true;
            selection.start = selection.end = before.length + middle.length;
            this._setSelection(selection);
          }
        });
        div.focus();
        setTimeout(() => {
          if (handled) {
            return;
          }
          var value = this.get("value") || "";
          var before = value.substr(0, selection.start);
          var middle = this.cleanupPaste(div.innerHTML);
          var after = value.substr(selection.end);
          this.set("value", before + middle + after);
          document.body.removeChild(div);
          selection.start = selection.end = before.length + middle.length;
          this._setSelection(selection);
        }, 50);
      }
    }.bind(this));
  },
  actions: {
    bold: function() {
      this._surroundSelection("**");
    },
    italic: function() {
      this._surroundSelection("*");
    },
    link: function() {
      this._currentSelection = this._getSelection();
      this.set("showLinkbox", true);
      var $ = this.$;
      setTimeout(function() { $(".cms-markdown-link-url")[0].focus(); }, 0);
    },
    insertLink: function() {
      if (this._currentSelection == null || this.get("showLinkbox") === false) { return; }
      var selection = this._currentSelection,
          link      = "[" + (selection.selected || this.get("linkUrl")) + "](" + this._getAbsoluteLinkUrl() + ")",
          value     = this.get("value") || "",
          before    = value.substr(0, selection.start),
          after     = value.substr(selection.end);

      if (this.get("linkUrl")) {
        this.set("value", before + link + after);
        selection.end = selection.start + link.end;
      }
      this.set("showLinkbox", false);
      this.set("linkUrl", null);
      this._setSelection(selection);
      this._currentSelection = null;
    }
  }
});