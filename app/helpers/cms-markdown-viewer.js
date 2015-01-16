import Ember from 'ember';
 /* global marked */

export default Ember.Handlebars.makeBoundHelper(function(input) {
  return new Ember.Handlebars.SafeString(marked(input || ""));
});
