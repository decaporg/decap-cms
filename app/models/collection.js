import Ember from 'ember';
import Field from './field';

var Collection = Ember.Object.extend({
  init: function() {
    this.id = this.slug;
    if (!this.fields) { return; }
    var fields = [];
    for (var i=0, len=this.fields.length; i<len; i++) {
      fields.push(Field.create(this.fields[i]));
    }
    this.fields = fields;
  },
  setEntry: function(entry) {
    this.entry = entry;
    for (var i=0, len=this.fields.length; i<len; i++) {
      this.fields[i].set("value", entry[this.fields[i].name]);
    }
  }
});

export default Collection;