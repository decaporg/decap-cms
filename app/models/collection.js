import Ember from 'ember';

var Collection = Ember.Object.extend({
  init: function() {
    this.id = this.slug;
  }
});

export default Collection;