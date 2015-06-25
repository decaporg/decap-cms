import Ember from 'ember';
import Sanitizer from '../utils/sanitizer';
import Shortcuts from '../mixins/keyboard_shortcuts';
import CaretPosition from 'npm:textarea-caret-position';

/**
@module app
@submodule components
*/

/**
  A textfield for markdown editing.

  Gives end users access to buttons and keyboard shortcuts for bold, italics, links.

  Handles image or file uploads through drag'n drop.

  Sanitizes and converts pasted content from Word/etc into clean markdown.

  ## Usage:

  ```htmlbars
  {{cms-markdown-editor label="Body" value=value}}
  ```

  @class CmsMarkdownEditor
  @extends Ember.Component
*/
export default Ember.Component.extend(Shortcuts, {
  init: function() {
    this._super.apply(this, arguments);
    this._undoStack = [];
    this._redoStack = [];
    this._undoing = false;
    this._selection = null;
    this._checkpoint = this.get("value");
  },
  cleanupPaste: function(html) {
    return new Sanitizer().sanitize(html);
  },
  tagName: "div",
  showLinkbox: false,
  linkUrl: null,
  toolbarX: 0,
  toolbarY: 0,
  toolbarOpen: false,
  shortcuts: {
    '⌘+b': 'bold',
    '⌘+i': 'italic',
    '⌘+l': 'link',
    '⇧+⌘+z': 'redo',
    '⌘+z': 'undo'
  },
  _getAbsoluteLinkUrl: function() {
    var url = this.get("linkUrl");
    if (url.indexOf("/") === 0) { return url; }
    if (url.match(/^https?\:\/\//)) { return url; }
    if (url.match(/^mailto\:/)) { return url; }
    if (url.match(/@/)) { return `mailto:${url}`; }
    return `http://${url}`;
  },
  _getSelection: function() {
    if (!this.$("textarea")) {
      return null;
    }
    var textarea = this.$("textarea")[0],
        start = textarea.selectionStart,
        end   = textarea.selectionEnd;
    return this._selection = {start: start, end: end, selected: (this.get("value") || "").substr(start, end-start)};
  },
  _setSelection: function(selection) {
    setTimeout(() => {
      var textarea = this.$("textarea")[0];
      textarea.selectionStart = selection.start;
      textarea.selectionEnd = selection.end;
      textarea.focus();
    }, 0);
  },

  _surroundSelection: function(chars) {
    var selection = this._getSelection(),
        newSelection = Ember.$.extend({}, selection),
        value = this.get("value") || "",
        changed = chars + selection.selected + chars,
        escapedChars = chars.replace(/\*/g, '\\*'),
        regexp = new RegExp("^" + escapedChars + ".+" + escapedChars + "$");

    if (regexp.test(selection.selected)) {
      changed = selection.selected.substr(chars.length,selection.selected.length - (chars.length * 2));
      newSelection.end = selection.end - (chars.length * 2) ;
    } else if (value.substr(selection.start-chars.length,chars.length) === chars && value.substr(selection.end, chars.length) === chars) {
      newSelection.start = selection.start - chars.length;
      newSelection.end = selection.end+chars.length;
      changed = selection.selected;
    } else {
      newSelection.end = selection.end + (chars.length * 2);
    }

    var before = value.substr(0,selection.start),
        after  = value.substr(selection.end);

    this.set("value", before + changed + after);

    this._setSelection(newSelection);
  },

  _toggleHeadline: function(header) {
    var value = this.get("value");
    var selection = this._getSelection();
    var i = selection.start;
    var m, before, after;
    while (i>=0) {
      if (value.substr(i,1) === "\n") {
        break;
      } else {
        i--;
      }
    }
    i += 1;
    before = value.substr(0,i);
    after = value.substr(i);
    if (m = after.match(/^(#+)\s/)) {
      if (m[1] === header) {
        after = after.replace(/^#+\s/, '');
        selection.end = selection.end - (m[1].length + 1);
      } else {
        after = after.replace(/^#+/, header);
        selection.end = selection.end - (m[1].length - header.length);
      }
      selection.start = i;
    } else {
      after = header + " " + after;
      selection.start = i;
      selection.end = selection.end + header.length + 1;
    }
    this.set("value", before + after);
    this._setSelection(selection);
  },

  linkToFiles: function(files) {
    var media = this.get("media");
    var mediaFiles = [];
    for (var i=0, len=files.length; i<len; i++) {
      mediaFiles.push(media.add(`${this.get("mediaFolder")}/${files[i].name}` , files[i]));
    }
    return new Ember.RSVP.Promise(function(resolve) {
      var file, image;
      var links = [];
      Ember.RSVP.Promise.all(mediaFiles).then(function(mediaFiles) {
        for (var i=0, len=mediaFiles.length; i < len; i++) {
          file = mediaFiles[i];
          image = file.name.match(/\.(gif|jpg|jpeg|png|svg)$/);
          links.push(`${image ? '!' : ''}[${file.name}](${file.publicPath})`);
        }
        resolve(links.join("\n"));
      });
    });
  },

  keyDown: function() {
    this._super.apply(this, arguments);
    this._getSelection();
  },

  getCleanPaste: function(event) {
    var transfer = event.originalEvent.clipboardData;
    return new Ember.RSVP.Promise((resolve) => {
      var data, isHTML;
      for (var i=0; i<transfer.types.length; i++) {
        if (transfer.types[i] === "text/html") {
          isHTML = true;
          break;
        }
      }

      if (isHTML) {
        data = transfer.getData("text/html");
        // Avoid trying to clean up full HTML documents with head/body/etc
        if (!data.match(/^\s*<!doctype/i)) {
          event.preventDefault();
          return resolve(this.cleanupPaste(data));
        } else {
          // Handle complex pastes by stealing focus with a contenteditable div
          var div = document.createElement("div");
          div.contentEditable = true;
          div.setAttribute("style", "opacity: 0; overflow: hidden; width: 1px; height: 1px; position: fixed; top: 50%; left: 0;");
          document.body.appendChild(div);
          div.focus();
          setTimeout(() => {
            resolve(this.cleanupPaste(div.innerHTML));
            document.body.removeChild(div);
          }, 50);
        }
      } else {
        event.preventDefault();
        resolve(transfer.getData(transfer.types[0]));
      }
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

    this.$("textarea").on("paste",
      (e) => {
        var selection = this._getSelection();
        var value = this.get("value") || "";
        var before = value.substr(0, selection.start);
        var after = value.substr(selection.end);

        this.getCleanPaste(e).then((paste) => {
          this.set("value", before + paste + after);
          selection.start = selection.end = before.length + paste.length;
          this._setSelection(selection);
        });
      }
    );

    this.$("textarea").on("blur focus keydown keyup mousedown mouseup",
      (e) => {
        setTimeout(() => {
          var el = e.originalEvent.target;
          this.set("toolbarOpen", window.document.activeElement == el && el.selectionStart !== el.selectionEnd);
        }, 0);
      }
    );


    var TextAreaCaretPositoon = new CaretPosition(this.$("textarea")[0]);
    this.$("textarea").on("select",
      (e) => {
        var el = e.originalEvent.target;
        var position = TextAreaCaretPositoon.get(el.selectionStart, el.selectionEnd);
        var offset = Ember.$(el).offset();
        this.set("toolbarX", Math.max(60, offset.left + position.left));
        this.set("toolbarY", offset.top + position.top);
        this.set("toolbarOpen", true);
      }
    );
  },

  bookmark: function(before) {
    var value;
    if (before) {
      value = this._checkpoint;
      this._checkpoint = this.get("value");
    } else {
      value = this._checkpoint = this.get("value");
    }

    return {
      before: this._selection,
      after: this._getSelection(),
      value: value
    };
  },

  appendToHistory: function() {
    if (this._undoing) {
      this._undoing = false;
    } else {
      this._undoStack.push(this.bookmark(true));
      this._redoStack = [];
    }
  }.observes("value"),

  actions: {
    h1: function() {
      this._toggleHeadline("#");
    },
    h2: function() {
      this._toggleHeadline("##");
    },
    h3: function() {
      this._toggleHeadline("###");
    },
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
    },
    undo: function() {
      var bookmark = this._undoStack.pop();
      if (bookmark) {
        this._redoStack.push(this.bookmark(false));
        this._undoing = true;
        this.set("value", bookmark.value);
        this._setSelection(bookmark.before);
      }
    },
    redo: function() {
      var bookmark = this._redoStack.pop();
      if (bookmark) {
        this._undoStack.push(this.bookmark(false));
        this._undoing = true;
        this.set("value", bookmark.value);
        this._setSelection(bookmark.after);
      }
    }
  }
});
