import Ember from 'ember';

export default Ember.Component.extend({
  tagName: "div",
  showLinkbox: false,
  linkUrl: null,
  _getAbsoluteLinkUrl: function() {
    var url = this.get("linkUrl");
    if (url.indexOf("/") === 0) { return url; }
    if (url.match(/^https?:\/\//)) { return url; }
    if (url.match(/^mailto:/)) { return url; }
    return "http://" + url;
  },
  _getSelection: function() {
    console.log("Gmm: %o", this);
    var textarea = this.$("textarea")[0],
        start = textarea.selectionStart,
        end   = textarea.selectionEnd;
    return {start: start, end: end, selected: (this.get("value") || "").substr(start, end-start)};
  },
  _setSelection: function(selection) {
    var textarea = this.$("textarea")[0];
    textarea.focus();
    textarea.selectionStart = selection.start;
    textarea.selectionEnd = selection.end;
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
  didInsertElement: function() {
    console.log("Binding events listeners on %o",this.$("textarea"));
    this.$("textarea").on("dragenter", function(e) {
      e.preventDefault();
    });
    this.$("textarea").on("dragover", function(e) {
      e.preventDefault();
    });
    this.$("textarea").on("drop", function(e) {
      e.preventDefault();
      console.log("Got event: %e");
      var data, textarea = this.$("textarea")[0];


      if (e.originalEvent.dataTransfer.files) {
        console.log("Got files");

      } else {
        console.log("Got text");
        data = Ember.RSVP.Promise.resolve(e.originalEvent.dataTransfer.getData("text/plain"));
      }
      data.then(function(text) {
        var selection = this._getSelection();
        var value = this.get("value");

        this.set("value", value.substr(0,selection.start) + text + value.substr(selection.end));
      }.bind(this));
      console.log(e);
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