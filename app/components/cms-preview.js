import Ember from 'ember';

export default Ember.Component.extend({
  tagName: "",
  widget: function() {
    var target = this.get("from") || this.get("targetObject");
    return target && target.get("widgets") && target.get("widgets").find((w) => w.get("name") === this.get("field"));
  }.property('targetObject.entry')
});
