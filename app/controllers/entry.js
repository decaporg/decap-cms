import Ember from 'ember';
import Widget from '../models/widget';
 /* global jsyaml */

export default Ember.Controller.extend({
  entry: null,
  entryPath: null,
  collection: null,
  slugify: function(text) {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
      .replace(/\-\-+/g, '-')         // Replace multiple - with single -
      .replace(/^-+/, '')             // Trim - from start of text
      .replace(/-+$/, '');            // Trim - from end of text
  },
  generateSlug: function() {
    var date = new Date();
    var titleWidget = this.get("widgets").filter(function(widget) { return widget.get("name") === "title"; })[0];

    return "" + date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + "-" + this.slugify(titleWidget.getValue());
  },

  currentAction: function() {
    return this.get("entryPath") ? "Edit" : "Create";
  }.property("entryPath"),
  widgets: function() {
    var fields = this.get("collection.fields");
    var widgets = Ember.A();
    for (var i=0, len=fields.length; i<len; i++) {
      widgets.push(Widget.create({field: fields[i], entry: this.get("entry"), value: this.get("entry." +fields[i].name)}));
    }
    return widgets;
  }.property("entry.fields.@each.widget"),
  isValid: function() {
    return this.get("widgets").every(function(widget) { return widget.get("isValid"); });
  }.property("widgets.@each.isValid"),
  isInvalid: Ember.computed.not("isValid"),
  toFileContent: function() {
    var widget;
    var meta = {};
    var content ="---\n";
    var body = "";
    var widgets = this.get("widgets");
    for (var i=0,len=widgets.length; i<len; i++) {
      widget = widgets[i];
      if (widget.get("name") === "body") {
        body = widget.getValue();
      } else {
        meta[widget.get("name")] = widget.getValue();  
      }
    }
    content += jsyaml.safeDump(meta);
    content += "---\n\n";
    content += body;
    return content;
  },
  actions: {
    save: function() {
      console.log("Widgets: ", this.get("widgets").map(function(w) { return [w.get("name"), w.get("isValid")].join(": "); }));
      if (this.get("isInvalid")) { return; }
      var path = this.get("entryPath") || this.get("collection.folder") + "/" + this.generateSlug() + ".md";
      this.get("repository").updateFiles({
        files: [{path: path, content: this.toFileContent()}],
        message: "Updated " + this.get("collection.label") + " " + this.get("entry.title")
      }).then(function() {
        console.log("Done!");
      });
    }
  }
});