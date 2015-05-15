import Ember from 'ember';

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

    return excerpt || this.get("_collection.formatter").excerpt(this.get("body"));
  }.property("body"),

  /**
    The `date` of the entry. Will either be a date or created_at attribute, the date based on the
    current URL of the entry or todays date.

    @property cmsDate
  */
  cmsDate: function() {
    return this.get("date") || this.get("created_at") || this.get("dateFromUrl") || new Date();
  }.property("date", "created_at", "dateFromUrl"),

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
  fromContent: function(collection, content, path) {
    return Entry.create(Ember.$.extend(collection.get("formatter").fromFile(content), {_collection: collection, _path: path, _file_content: content}));
  }
});

export default Entry;
