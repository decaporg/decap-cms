import Ember from 'ember';

var Collection = Ember.Object.extend({
  init: function() {
    this.id = this.slug;
    this.format = this.format || "frontmatter";
  },
  getExtension: function() {
    return this.get("extension") || this.formatter.extension;
  }
});

export default Collection;