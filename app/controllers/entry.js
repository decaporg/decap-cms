import Ember from 'ember';
import Widget from '../models/widget';
 /* global jsyaml */

export default Ember.Controller.extend({
  needs: ['application'],
  entryPath: Ember.computed.alias("entry._path"),
  prepare: function(collection, entry) {
    this.set("collection", collection);
    this.set("entry", entry);
    this.set('controllers.application.currentAction', this.get("currentAction") + " " + this.get("collection.label"));
    this.initWidgets();
  },
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

  initWidgets: function() {
    var fields = this.get("collection.fields");
    var widgets = Ember.A();
    for (var i=0, len=fields.length; i<len; i++) {
      widgets.push(Widget.create({field: fields[i], entry: this.get("entry"), value: this.get("entry." +fields[i].name)}));
    }
    this.set("widgets", widgets);
  },
  isValid: function() {
    return this.get("widgets").every(function(widget) { return widget.get("isValid"); });
  }.property("widgets.@each.isValid"),
  isInvalid: Ember.computed.not("isValid"),
  disableButton: function() {
    return this.get("isInvalid") || this.get("saving");
  }.property("isInvalid", "saving"),
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
  notifyOnDeploy: function() {
    if (this.deployChecker) { return; }
    var base = Ember.$("base").attr("href") || "/";
    Ember.$.getJSON(base + "ts.json").then(function(data) {
      var current = data.ts;
      this.deployChecker = function() {
        Ember.$.getJSON(base + "ts.json").then(function(data) {
          var state = data.ts;
          console.log("Got state - '%o' (current: '%o')", state, current);
          if (state !== current) {
            this.get("notifications").notify("Changes are live", "Your site has been built and deployed.");
          } else{
            setTimeout(this.deployChecker, 1000);
          }
        }.bind(this));
      }.bind(this);
      this.deployChecker();
    }.bind(this));
  },
  actions: {
    save: function() {
      if (this.get("isInvalid")) { return; }
      var path = this.get("entryPath") || this.get("collection.folder") + "/" + this.generateSlug() + ".md";
      this.set("saving", true);
      this.notifyOnDeploy();
      this.get("repository").updateFiles({
        files: [{path: path, content: this.toFileContent()}],
        message: "Updated " + this.get("collection.label") + " " + this.get("entry.title")
      }).then(function() {
        console.log("Done!");
        this.set("saving", false);
      }.bind(this), function(err) {
        console.log("Error saving: %o", err);
        this.set("error", err);
      }.bind(this));
    }
  }
});