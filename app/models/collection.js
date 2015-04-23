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
  /* Set the id and format */
  init: function() {
    this.id = this.slug;
    this.format = this.format || "frontmatter";
  },
  /**
    The extension for documents in this collection

    @method getExtension
    @return {String} extension
  */
  getExtension: function() {
    return this.get("extension") || this.formatter.extension;
  }
});

export default Collection;
