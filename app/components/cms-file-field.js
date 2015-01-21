import Ember from 'ember';

export default Ember.TextField.extend({
  type: 'file',
  classNames: ['cms-file-field'],
  attributeBindings: ['multiple'],
  change: function(e) {
    console.log("Change event: %o", e);
    console.log(this.element.files);
    this.sendAction('action', this.element.files);
  }
});