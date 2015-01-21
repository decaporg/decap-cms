import Ember from 'ember';
 /* global moment */


export default Ember.TextField.extend({
  type: 'date',
  placeholderBinding: 'dateFormat',
  dateFormat: function() {
    return "YYYY-MM-DD"
  }.property()
});