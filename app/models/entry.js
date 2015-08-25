import Ember from 'ember';
import {slugify} from '../utils/slugify';
/* global moment */

/**
@module app
@submodule models
*/

/**
 Represents an entry in a collection or a single document

 @class Entry
 @extends Ember.Object
 */
var Entry = Ember.Object.extend({
  /**
    Excerpt of the entry for lists/etc.

    @property cmsExcerpt
  */
  cmsExcerpt: function() {
    var excerpt = this.get("excerpt") || this.get("description");
    return excerpt || this.get("_formatter").excerpt(this.get("body"));
  }.property("body"),

  /**
    The `date` of the entry. Will either be a date or created_at attribute, the date based on the
    current URL of the entry or todays date.

    @property cmsDate
  */
  cmsDate: function() {
    return this.get("date") || this.get("created_at") || this.get("dateFromUrl") || moment();
  }.property("date", "created_at", "dateFromUrl"),


  cmsUserSlug: Ember.computed("title", {
    get: function() {
      return slugify(this.get("_cmsUserSlug") || this.get("title") || "");
    },
    set: function(key, value) {
      value = slugify(value);
      this.set("_cmsUserSlug", value);
      return value;
    }
  }),

  cmsTitle: function() {
    var doc = this.get("_doc");
    return this.get("title") || doc.title || this.get("cmsSlug");
  }.property("title", "_doc"),

  cmsSlug: function() {
    if (this.get("cmsIsDocument")) {
      return this.get("_doc.name");
    } else if (this.get("_path")) {
      return this.get("_path").split("/").pop().split(".").slice(0,-1).join(".");
    } else {
      return this.get("_collection.slugFormatter")(this);
    }
  }.property("cmsUserSlug", "cmsDate", "title", "_doc"),

  cmsPath: function() {
    if (this.get("cmsIsDocument")) {
      return this.get("_doc.file");
    }
    return this.get("_path") || (this.get("_collection.folder") + "/" + this.get("cmsSlug") + "." + (this.get("_collection").getExtension() || "md"));
  }.property("cmsSlug"),

  cmsFields: function() {
    var doc = this.get("_doc");
    return doc && doc.fields;
  }.property("_doc"),

  cmsIsDocument: function() {
    return this.get("_doc") ? true : false;
  }.property("_doc"),

  /**
    Convert the entry to file content via the `format` of the collection.

    @method toFileContent
    @param {Array} widgets
    @param {Array} metaFields
    @return {String} fileContent
  */
  toFileContent: function(widgets, metaFields) {
    var widget;
    var meta;
    var i;
    var len;
    var obj = {};
    var formatter = this.get("_collection").getFormatter(this.get("cmsPath"));

    for (i=0,len=widgets.length; i<len; i++) {
      widget = widgets[i];
      obj[widget.get("name")] = widget.getValue();
    }

    for (i=0,len=metaFields.length; i<len; i++) {
      meta = metaFields[i];
      obj[meta.get("name")] = meta.getValue();
    }

    return formatter.toFile(obj, this);
  },

  cmsNewRecord: function() {
    return !this.get("_path");
  }.property("_path"),

  cmsSave: function(widgets, metas) {
    var repository = this.get("collection.repository");
    var path = this.get("cmsPath");
    var files = [{path: path, content: this.toFileContent(widgets, metas)}];
    var commitMessage = (this.get("cmsNewRecord") ? "Created " : "Updated ") +
          this.get("_collection.label") + " " +
          this.get("title");

    return this.get("_collection.repository").updateFiles(files, {message: commitMessage}).then(() => this);
  },

  /**
    The orignal file content of the entry.

    @property cmsFileContent
  */
  cmsFileContent: Ember.computed.alias("_file_content"),

  /**
    The date of the entry inferred from the current URL of the entry.

    Right now this is a really naive method, always assuming that entries are stored via:

    `yyyy-mm-dd-slug`

    @property dateFromUrl
  */
  dateFromUrl: function() {
    // TODO: check collection.entry_path to figure out if we have date parts in the url
    if (!this._path) { return null; }

    var name = this._path.split("/").pop();
    var match = name.match(/^(\d\d\d\d-\d\d-\d\d)-/);
    if (match) {
      return new Date(match[1]);
    }
  }.property("_path")
});

Entry.reopenClass({
  /**
    Instantiates a new entry model from a file content.

    @method fromContent
    @param {Collection} collection
    @param {String} content
    @param {String} path
    @static
    @return {Entry} entry
  */
  fromContent: function(collection, content, path, metadata) {
    var formatter = collection.getFormatter(path);
    return Entry.create(
      Ember.$.extend(
        formatter.fromFile(content),
        {_collection: collection, _path: path, _file_content: content, _formatter: formatter},
        metadata
      ));
  },

  fromFile: function(collection, file, metadata) {
    return collection.get("repository").readFile(file.path, file.sha).then((content) => {
      return Entry.fromContent(collection, content, file.path, metadata);
    });
  }
});

export default Entry;
