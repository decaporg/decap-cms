import Ember from 'ember';

export default Ember.TextField.extend({
  type: 'file',
  classNames: ['cms-file-field'],
  attributeBindings: ['multiple'],
  change: function() {
    this.sendAction('action', this.element.files);
  }
});