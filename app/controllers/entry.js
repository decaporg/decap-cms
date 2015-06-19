import Ember from 'ember';
import Widget from '../models/widget';

/**
@module app
@submodule components
*/

/**
 Handles creating and editing entries in a collection.

 @class EntryController
 @extends Ember.Controller
 */
export default Ember.Controller.extend({
  templateName: "entry",

  needs: ['application'],

  /**
   The path to the file in the repository representing the current entry

   @property entryPath
  */
  entryPath: Ember.computed.alias("entry._path"),

  /**
    Prepare the controller. The router calls this when setting up the controller.

    @method prepare
    @param {Object} collection
    @param {Object} entry
  */
  prepare: function(collection, entry) {
    this.set("collection", collection);
    this.set("entry", entry);
    this.set('controllers.application.currentAction', this.get("currentAction") + " " + this.get("collection.label"));
    this.initWidgets();
    this.initMeta();
  },

  /**
   Convert a title to a slug suitable for use in URLs and filenames.

   @method slugify
   @param {String} text
   @return {String} slug
  */
  slugify: function(text) {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
      .replace(/\-\-+/g, '-')         // Replace multiple - with single -
      .replace(/^-+/, '')             // Trim - from start of text
      .replace(/-+$/, '');            // Trim - from end of text
  },

  /**
   Resolve the repository path for the current entry.

   If the entry is a new entry it creates a new path for the entry.

   Right now there's no check to see if we're overwriting an existing path.

   The method returns a Promise, since in the future we'll need to check with
   the repository whether there's already a file with this name (and that's an
   async operation).

   @method getFilePath
   @return {Ember.RSVP.Promise} filepath
  */
  getFilePath: function() {
    return Ember.RSVP.Promise.resolve(this.get("entry.cmsPath"));
  },

  /**
   Label for the current action (Edit/Create)

   @property currentAction
  */
  currentAction: function() {
    return this.get("entryPath") ? "Edit" : "Create";
  }.property("entryPath"),

  /**
   Breadcrumbs for this controller.

   @property breadcrumbs
  */
  breadcrumbs: function() {
    if (this.get("entryPath")) {
      return [
        {
          label: `${this.get("collection.label")} List`,
          path: "index.list",
          model: this.get("collection"),
        },
        {
          label: `Edit ${this.get("collection.label")}`,
          path: "edit",
          model: this.get("entry")
        }
      ];
    } else {
      return [{
        label: `New ${this.get("collection.label")}`,
        path: "create",
        model: this.get("collection")
      }];
    }
  }.property("currentAction"),

  /**
   Initialized the widgets for this entry.

   One widget is instantiated for each of the fields in the collection.

   @method initWidgets
  */
  initWidgets: function() {
    var widgets = Ember.A();
    this.get("collection.fields").forEach((field) => {
      var value = this.get(`entry.${field.name}`);
      if (typeof value === "undefined") {
        value = field['default'] || null;
      }
      widgets.push(Widget.create({
        field: field,
        entry: this.get("entry"),
        value: value
      }));
    });

    this.set("widgets", widgets);
  },

  initMeta: function() {
    var meta = Ember.A();

    var defaultFields = [
      {label: "Slug", name: "cmsUserSlug", widget: "slug"}
    ];
    var existingDateField = (this.get("collection.fields") || []).filter((f) => f.name === 'date')[0];
    var existingDateMeta  = (this.get("collection.meta") || []).filter((f) => f.name === 'date')[0];
    if (!(existingDateField || existingDateMeta)) {
      defaultFields.push({label: "Publish Date", name: "date", widget: "date", default: "now"});
    }

    defaultFields.concat(this.get("collection.meta") || []).forEach((field) => {
      var value = this.get(`entry.${field.name}`);
      if (typeof value === "undefined") {
        value = field['default'] || null;
      }
      meta.push(Widget.create({
        field: field,
        entry: this.get("entry"),
        value: value
      }));
    });

    this.set("meta", meta);
  },

  /**
    The `valid` state of the current entry.

    An entry is valid if each of the widgets is valid.

    @property isValid
  */
  isValid: function() {
    return this.get("widgets").every(function(widget) { return widget.get("isValid"); });
  }.property("widgets.@each.isValid"),

  /**
    Opposite of `isValid`.

    @property isInvalid
  */
  isInvalid: Ember.computed.not("isValid"),


  disableButton: function() {
    return this.get("isInvalid") || this.get("saving");
  }.property("isInvalid", "saving"),

  /**
    Convert the current entry to file content via the `format` of the collection.

    @method toFileContent
    @return {String} fileContent
  */
  toFileContent: function() {
    var widget;
    var meta;
    var i;
    var len;
    var obj = {};
    var formatter = this.get("collection.formatter");
    var widgets = this.get("widgets");
    var metas   = this.get("meta");

    for (i=0,len=widgets.length; i<len; i++) {
      widget = widgets[i];
      obj[widget.get("name")] = widget.getValue();
    }

    for (i=0,len=metas.length; i<len; i++) {
      meta = metas[i];
      obj[meta.get("name")] = meta.getValue();
    }

    return formatter.toFile(obj, this.get("entry"));
  },

  /**
    Check for a ts.json with a deploy timestamp and poll it if it exists.

    Send a desktop notification once it changes.

    @method notifyOnDeploy
  */
  notifyOnDeploy: function() {
    if (this.deployChecker) { return; }
    var base = Ember.$("base").attr("href") || "/";
    Ember.$.getJSON(base + "ts.json").then(function(data) {
      var current = data.ts;
      this.deployChecker = function() {
        Ember.$.getJSON(base + "ts.json").then(function(data) {
          var state = data.ts;
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
    toggleActions: function() {
      this.set("actionsOpen", !this.get("actionsOpen"));
    },

    /**
      Saves the current entry if valid.

      Tells the repository to commit the fileContent of the current entry and
      all uploaded media files.

      @method save
    */
    save: function() {
      if (this.get("isInvalid")) { return; }

      this.getFilePath().then((path) => {
        var files = [{path: path, content: this.toFileContent()}];
        var commitMessage = "Updated " + this.get("collection.label") + " " +
                                         this.get("entry.title");

        this.set("saving", true);

        // Start watching for a deploy
        //this.notifyOnDeploy();

        this.get("repository").updateFiles(files, {message: commitMessage}).then(() => {
          this.set("saving", false);
          this.set("actionsOpen", false);
          this.get("widgets").forEach((w) => { w.set("dirty", false); });

          // If the entry was a new record, we'll transition the route to the
          // edit screen for that entry
          if (!this.get("entryPath")) {
            this.set("entry._path", path);
            this.transitionToRoute("edit", this.get("entry"));
          }
        }, (err) => {
          // Definitively needs better error reporting here...
          console.log("Error saving: %o", err);
          this.set("error", err);
        });
      }).catch((err) => {
          console.log("Error :%o", err);
      });
    }
  }
});
