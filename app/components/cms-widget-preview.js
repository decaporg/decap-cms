import Ember from 'ember';

export default Ember.Component.extend({
  tagName: "",
  init: function() {
    this._super();
    this.set("tagName", this.get("widget.field.tagname") || "div");
    this.set("classNames", (this.get("widget.field.class") || "").split(" "));
  },
  layoutName: function() {
    var type = this.get("widget.field.preview") || (this.get("widget.type") + "_preview");
    return this.container && this.container.lookup("template:cms/widgets" + type) ? "cms/widgets/" + type : "widgets/" + type;
  }.property("widget.type")
});
