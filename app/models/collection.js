import Ember from 'ember';

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
    this.format = this.format || "markdown-frontmatter";
    this.slugFormatter = slugFormatterFn(this.slug);
  },
  /**
    The extension for documents in this collection

    @method getExtension
    @return {String} extension
  */
  getExtension: function() {
    return this.get("extension") || this.get("formatter").extension;
  },

  formatter: function() {
    return this.get("config.container").lookup("format:" + this.get("format"));
  }.property("config.ready"),

  mediaFolder: function() {
    return this.get("media_folder") || this.get("config.media_folder") || "uploads";
  }.property("media_folder", "config.media_folder")
});

export default Collection;
