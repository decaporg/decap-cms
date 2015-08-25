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
          return entry.get("cmsDate").month() + 1;
        case "day":
          return entry.get("cmsDate").date();
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

  formatter: function() {
    return this.get("config.container").lookup("format:" + this.get("format"));
  }.property("config.ready"),

  repository: function() {
    console.log("Get repository from %o", this.get("config.container"));
    return this.get("config.container").lookup("service:repository");
  }.property("config.container"),

  getFormatter: function(path) {
    console.log("Getting formatter for %s", path);
    if (this.get("format")) {
      return this.get("formatter");
    }
    // TODO: Make this work with custom formatters
    var extension = (path || "").split(".").pop();
    switch(extension) {
      case "json":
        return this.get("config.container").lookup("format:json");
      case "yml":
        return this.get("config.container").lookup("format:yml");
      case "md":
        return this.get("config.container").lookup("format:markdown_frontmatter");
    }

  },

  mediaFolder: function() {
    return this.get("media_folder") || this.get("config.media_folder") || "uploads";
  }.property("media_folder", "config.media_folder"),

  loadEntriesFromFolder: function() {
    console.log("Getting repository");
    var repository = this.get("repository");
    var extension = this.getExtension();

    console.log("Repsitory is: %o", repository);
    return repository && repository.listFiles(this.get("folder")).then((files) => {
      files = files.filter((file) => extension == null || this.gfile.name.split(".").pop() === extension).map((file) => {
        return Entry.fromFile(this, file);
      });
      return Ember.RSVP.Promise.all(files);
    });
  },

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

  findEntry: function(slug) {
    if (this.get("folder")) {
      var path = this.get("folder") + "/" + slug + "." + (this.getExtension() || "md");
      console.log("Finding file - repository: %o", this.get("repository"));
      return Entry.fromFile(this, {path: path});
    } else if (this.get("files")) {
      var doc = this.get("files").find((doc) => {console.log("Comparing %o with %s", doc, slug); return doc.name == slug});
      return doc ? Entry.fromFile(this, {path: doc.file}, {_doc: doc}) : Ember.RSVP.Promise.reject("File not found");
    } else if (this.get("file")) {
      //
    } else {
      alert("This collection doesn't have any entries configured. Set either 'folder', 'file' or 'files' in your config.yml");
    }
  }
});

export default Collection;
