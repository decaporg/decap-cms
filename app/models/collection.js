import Ember from 'ember';
import Entry from './entry';

function slugFormatterFn(template) {
  if (!template) { return function(entry) { return entry.get("cmsUserSlug"); }; }

  return function(entry) {
    return template.replace(/\{\{([^\}]+)\}\}/g, function(_, name) {
      switch(name) {
        case "year":
          return entry.get("cmsDate").year();
        case "month":
          return ('0' + (entry.get("cmsDate").month() + 1)).slice(-2);
        case "day":
          return ('0' + entry.get("cmsDate").date()).slice(-2);
        case "slug":
          return entry.get("cmsUserSlug");
        default:
          return entry.get(name);
      }
    });
  };
}

/**
@module app
@submodule models
*/

/**
 A Collection of entries

 @class Collection
 @extends Ember.Object
 */

var Collection = Ember.Object.extend({
  /* Set the id and format. Default format is markdown with frontmatter */
  init: function() {
    this._super.apply(this, arguments);
    this.id = this.name;
    this.slugFormatter = slugFormatterFn(this.slug);
  },

  id: Ember.computed.alias("name"),
  collection_id: Ember.computed.alias("name"),

  /**
    The extension for documents in this collection

    @method getExtension
    @return {String} extension
  */
  getExtension: function() {
    return this.get("extension") || this.get("formatter.extension");
  },

  /**
    The formatter for this collection
    Note: a collection of individual file documents, might have a different formatter
    for each document and in that case this will return null

    @property formatter
  */
  formatter: function() {
    return this.get("config.container").lookup("format:" + this.get("format"));
  }.property("config.ready"),

  /**
    The Git repository we're working on

    @property repository
  */
  repository: function() {
    return this.get("config.container").lookup("service:repository");
  }.property("config.container"),

  /**
    Get the formatter for a path

    If the collection has an explicit formatter set, that will be returned. Otherwise
    the formatter will be determined based on the file extension.

    @method getFormatter
    @param {String} path
    @return {Format} formatter
  */
  getFormatter: function(path) {
    if (path && this.get("files")) {
      var doc = this.get("files").find((doc) => doc.file === path);
      if (doc && doc.format) {
        return this.get("config.container").lookup("format:" + doc.format);
      }
    }

    if (this.get("format")) {
      return this.get("formatter");
    }
    if (this.get("config.format")) {
      return this.get("config.formatter");
    }
    // TODO: Make this work with custom formatters
    var extension = (path || "").split(".").pop();
    switch(extension) {
      case "json":
        return this.get("config.container").lookup("format:json");
      case "yml":
        return this.get("config.container").lookup("format:yaml");
      case "md":
        return this.get("config.container").lookup("format:markdown-frontmatter");
    }
  },

  /**
    The folder where media should be stored for this collection.

    @property mediaFolder
  */
  mediaFolder: function() {
    return this.get("media_folder") || this.get("config.media_folder") || "uploads";
  }.property("media_folder", "config.media_folder"),

  fileSorter: function(files) {
    var type = this.get("sort") || "slug";

    if (type === "slug") {
      if ((this.slug || "").match(/^\{\{year\}\}-\{\{month\}\}-\{\{day\}\}/)) {
        return {
          async: false,
          fn: (a, b) => {
            var dateA = new Date(a.name.split("-").slice(0, 3).join("-"));
            var dateB = new Date(b.name.split("-").slice(0, 3).join("-"));

            return dateA > dateB ? -1 : ( dateA === dateB ? 0 : 1);
          }
        };
      } else {
        return {
          async: false,
          fn: (a, b) => {
            return a.name.localeCompare(b.name);
          }
        };
      }
    }

    var m = type.match("^([^:]+)(?::(asc|desc))?");
    var field = m[1] || 'title';
    var order = m[2] || 'asc';
    return {
      async: true,
      fn: (a, b) => {
        var first, second;
        if (order === "asc") {
          first = a.get(field);
          second = b.get(field);
        } else {
          first = b.get(field);
          second = a.get(field);
        }

        return first > second ? 1 : (first < second ? -1 : 0);
      }
    };
  },

  loadFromQueue: function(queue) {
    if (queue.length) {
      var obj = queue.shift();
      var formatter = this.getFormatter(obj.file.path);
      return this.get("repository").readFile(obj.file.path, obj.file.sha).then((content) => {
        obj.entry.setProperties(Ember.$.extend(
          formatter.fromFile(content),
          {_file_content: content, _formatter: formatter, cmsLoading: false},
          {_doc: obj.file.doc}
        ));
        return this.loadFromQueue(queue);
      });
    } else {
      return Ember.RSVP.Promise.resolve(true);
    }
  },

  /**
    Loads all entries from a folder. If an extension is specified for the collection,
    only files with that extension will be processed.

    @method loadEntriesFromFolder
    @return {Promise} entries
  */
  loadEntriesFromFolder: function() {
    var repository = this.get("repository");
    var extension = this.getExtension() || "md";

    if (!repository) {
      return Ember.RSVP.Promise.resolve([]);
    }

    return repository && repository.listFiles(this.get("folder")).then((files) => {
      var loadQueue = [];

      files = files.filter((file) => extension == null || file.name.split(".").pop() === extension);
      var fileSorter = this.fileSorter(files);
      if (fileSorter.async === false) {
        files = files.sort(fileSorter.fn);
      }

      var entries = files.map((file) => {
          var entry = Entry.create({_collection: this, _path: file.path, cmsLoading: true});
          loadQueue.push({entry: entry, file: file});
          return entry;
        });

      var lazyLoader = this.loadFromQueue(loadQueue);

      if (fileSorter.async) {
        return lazyLoader.then(() => entries.sort(fileSorter.fn));
      }

      return entries;
    });
  },

  /**
    Loads entries from individual files specified directly in the collection configuration.

    @method loadEntriesFromFiles
    @return {Promise} entries
  */
  loadEntriesFromFiles: function() {
    var repository = this.get("repository");

    var files = this.get("files").map((doc) => {
      return repository.readFile(doc.file).then((content) => {
        return {path: doc.file, content: content, doc: doc};
      }, (err) => {
        console.log("Error reading file :( %o", err);
      });
    });
    return Ember.RSVP.Promise.all(files).then((files) => {
      return files.map((file) => {
        return Entry.fromContent(this, file.content, file.path, {_doc: file.doc});
      });
    });
  },

  /**
    Loads the entries in this collection

    @method loadEntries
    @return {Promise} entries
  */
  loadEntries: function() {
    if (this.get("folder")) {
      return this.loadEntriesFromFolder();
    } else if (this.get("files")) {
      return this.loadEntriesFromFiles();
    } else if (this.get("file")) {
      return this.loadEntriesFromFile();
    } else {
      alert("This collection doesn't have any entries configured. Set either 'folder', 'file' or 'files' in your config.yml");
    }
  },

  /**
    Find an entry by slug.

    @method findEntry
    @param {String} slug
    @return {Promise} entry
  */
  findEntry: function(slug) {
    if (this.get("folder")) {
      var path = this.get("folder") + "/" + slug + "." + (this.getExtension() || "md");
      return Entry.fromFile(this, {path: path});
    } else if (this.get("files")) {
      var doc = this.get("files").find((doc) => doc.name === slug);
      return doc ? Entry.fromFile(this, {path: doc.file}, {_doc: doc}) : Ember.RSVP.Promise.reject("File not found");
    } else if (this.get("file")) {
      // TODO: Load multiple entries from a single document
    } else {
      alert("This collection doesn't have any entries configured. Set either 'folder', 'file' or 'files' in your config.yml");
    }
  }
});

export default Collection;
