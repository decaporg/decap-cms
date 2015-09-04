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
    Whether this is a new record or an already persisted record

    @property newRecord
  */
  newRecord: function() {
    return this.get("entry.cmsNewRecord");
  }.property("entry.cmsNewRecord"),

  canCreate: function() {
    return !!this.get("collection.create");
  }.property("collection.create"),

  canDelete: function() {
    return !this.get("entry.cmsNewRecord") && this.get("collection.create");
  }.property("collection.create", "entry.cmsNewRecord"),

  /**
    Prepare the controller. The router calls this when setting up the controller.

    @method prepare
    @param {Object} collection
    @param {Object} entry
  */
  prepare: function(collection, entry) {
    this.set("collection", collection);
    this.set("entry", entry);
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
    return this.get("newRecord") ? "Create" : "Edit";
  }.property("newRecord"),

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
      return [
      {
        label: `${this.get("collection.label")} List`,
        path: "index.list",
        model: this.get("collection"),
      },{
        label: `New ${this.get("collection.label")}`,
        path: "create",
        model: this.get("collection")
      }];
    }
  }.property("currentAction", "collection.label", "entry"),

  /**
   The widgets for this entry.

   One widget is instantiated for each of the fields in the collection.

   @property widgets
  */
  widgets: function() {
    var widgets = Ember.A();

    (this.get("entry.cmsFields") || []).forEach((field) => {
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

    return widgets;
  }.property("entry"),

  meta: function() {
    var meta = Ember.A();

    var defaultFields = [];
    if (!this.get("entry.cmsIsDocument")) {
      defaultFields.push({label: "Slug", name: "cmsUserSlug", widget: "slug"});
    }
    var existingDateField = (this.get("collection.fields") || []).filter((f) => f.name === 'date')[0];
    var existingDateMeta  = (this.get("collection.meta") || []).filter((f) => f.name === 'date')[0];
    if (!(existingDateField || existingDateMeta || this.get("entry.cmsIsDocument"))) {
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

    return meta;
  }.property("entry"),

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
      this.set("errorMessage", null);
      if (this.get("isInvalid")) {
        this.set("errorMessage",this.get("widgets").find((w) => !w.get("isValid")).get("label") + " has not been filled out correctly");
        return;
      }

      this.set("saving", true);
      this.get("entry").cmsSave(this.get("widgets"), this.get("meta")).then((entry) => {
        this.set("saving", false);
        this.set("actionsOpen", false);
        this.get("widgets").forEach((w) => { w.set("dirty", false); });

        this.transitionToRoute("edit", entry);
      }).catch((err) => {
        // Definitively needs better error reporting here...
        console.log("Error saving: %o", err);
        this.set("error", err);
      });
    },

    delete: function() {
      console.log("Deleted");
      if (this.get("newRecord")) {
        // Can't delete if not persisted...
        return;
      }

      if (confirm("Are you sure you want to delete this entry?")) {
        this.set("saving", true);
        this.get("entry").cmsDelete().then(() => {
          this.set("saving", false);
          this.set("actionsOpen", false);
          this.send("hideSidebar");
          this.transitionToRoute("index.list", this.get("collection"));
        }).catch((err) => {
          // Definitively needs better error reporting here...
          console.log("Error saving: %o", err);
          this.set("error", err);
        });
      }
    }
  }
});
