import Ember from 'ember';

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
    this.id = this.slug;
    this.format = this.format || "markdown-frontmatter";
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
    console.log("Looking up format %o", this.get("config"));
    return this.get("config.container").lookup("format:" + this.get("format"));
  }.property("config.ready")
});

export default Collection;
