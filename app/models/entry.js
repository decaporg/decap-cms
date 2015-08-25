import Ember from 'ember';
import {slugify} from '../utils/slugify';
/* global moment */

/**
@module app
@submodule models
*/

/**
 Represents an entry in a collection or a single document

 Note, since the properties on this object represents the keys/values in a CMS
 document, all properties that are not part of the CMS document, are camelcase
 and prefixed with cdm (ie. cmsExcerpt, cmsSlug, etc...).

 @class Entry
 @extends Ember.Object
 */
var Entry = Ember.Object.extend({
  /**
    Excerpt of the entry for the entry listing

    @property cmsExcerpt
  */
  cmsExcerpt: function() {
    if (this.get("_doc.description")) {
      return this.get("_doc.description");
    }
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


  /**
    The slug we'll show to the user in the meta input for slug.

    This is often different from the filename of the document. Ie, when using a
    permalink structure like "{year}-{month}-{day}-{slug}", the user slug will
    only be the final slug part.

    @property cmsUserSlug
  */
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

  /**
    The title of an entry showed in lists, relations, etc...

    @property cmsTitle
  */
  cmsTitle: function() {
    if (this.get("_doc.label")) {
      return this.get("_doc.label");
    }
    return this.get("title") || this.get("cmsSlug");
  }.property("title", "_doc"),

  /**
    The slug of an entry

    @property cmsSlug
  */
  cmsSlug: function() {
    if (this.get("cmsIsDocument")) {
      return this.get("_doc.name");
    } else if (this.get("_path")) {
      return this.get("_path").split("/").pop().split(".").slice(0,-1).join(".");
    } else {
      return this.get("_collection.slugFormatter")(this);
    }
  }.property("cmsUserSlug", "cmsDate", "title", "_doc"),

  /**
    File path of an entry within the repository

    @property cmsPath
  */
  cmsPath: function() {
    if (this.get("cmsIsDocument")) {
      return this.get("_doc.file");
    }
    return this.get("_path") || (this.get("_collection.folder") + "/" + this.get("cmsSlug") + "." + (this.get("_collection").getExtension() || "md"));
  }.property("cmsSlug"),

  /**
    All the fields this entry has

    @property cmsFields
  */
  cmsFields: function() {
    return (this.get("_collection.fields") || []).concat(this.get("_doc.fields") || []);
  }.property("_doc"),

  /**
    Whether this entry is a document (in a collection of individual document files)
    or an entry (a collection with similar entry types)

    @property cmsIsDocument
  */
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

  /**
    Whether this entry is a new record or an existing file

    @property cmsNewRecord
  */
  cmsNewRecord: function() {
    return !this.get("_path");
  }.property("_path"),


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
  }.property("_path"),

  /**
    Save the entry (must pass in the widgets and metaFields from the controller)

    @method toFileContent
    @param {Array} widgets
    @param {Array} metaFields
    @return {Promise} entry
  */
  cmsSave: function(widgets, metaFields) {
    var path = this.get("cmsPath");
    var files = [{path: path, content: this.toFileContent(widgets, metaFields)}];
    var commitMessage = (this.get("cmsNewRecord") ? "Created " : "Updated ") +
          this.get("_collection.label") + " " +
          this.get("cmsTitle");

    return this.get("_collection.repository").updateFiles(files, {message: commitMessage}).then(() => this);
  },

  /**
    Delete the entry

    @method cmsDelete
    @return {Promise} deleted
  */
  cmsDelete: function() {
    if (!this.get("_collection.create")) {
      throw("Can't delete entries in collections with creation disabled");
    }
    var file = {path: this.get("cmsPath")};
    var commitMessage = "Deleted " + this.get("_collection.label") + " " +
                                     this.get("cmsTitle");

    return this.get("_collection.repository").deleteFile(file, {message: commitMessage})
  }
});

Entry.reopenClass({
  /**
    Instantiates a new entry model from a file content.

    @method fromContent
    @param {Collection} collection
    @param {String} content
    @param {String} path
    @param {Object} metadata
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

  /**
    Instantiates a new entry model from a file object

    @method fromFile
    @param {Collection} collection
    @param {File} file
    @param {Object} metadata
    @static
    @return {Entry} entry
  */
  fromFile: function(collection, file, metadata) {
    return collection.get("repository").readFile(file.path, file.sha).then((content) => {
      return Entry.fromContent(collection, content, file.path, metadata);
    });
  }
});

export default Entry;
