import Ember from 'ember';

export default Ember.Component.extend({
  tagName: "",
  layoutName: function() {
    var type = this.get("widget.type");
    return this.container && this.container.lookup("template:cms/widgets" + type) ? "cms/widgets/" + type : "widgets/" + type;
  }.property("widget.type")
});
