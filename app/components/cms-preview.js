import Ember from 'ember';

export default Ember.Component.extend({
  tagName: "",
  widget: function() {
    return this.get("targetObject.widgets").find((w) => w.get("name") == this.get("field"));
  }.property('targetObject')
});
