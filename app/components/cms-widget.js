import Ember from 'ember';

export default Ember.Component.extend({
  tagName: "",
  layoutName: function() {
    return this.container && this.container.lookup("template:cms/components/widget") ? "cms/components/widget" : "components/widget";
  }.property("widget")
});