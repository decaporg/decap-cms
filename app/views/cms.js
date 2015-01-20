import Ember from 'ember';

var TemplateConversions = {
  create: "entry",
  edit: "entry"
};

export default Ember.View.extend({
  tagName: "",
  init: function() {
    this._super.apply(this, arguments);
    var name = this.templateName || this.renderedName;
    name = TemplateConversions[name] || name;
    this.set("templateName", this.container.lookup("template:cms/" + name) ? "cms/" + name : name);
  },
  templateName: null
});