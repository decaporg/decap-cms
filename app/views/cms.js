import Ember from 'ember';

var TemplateConversions = {
  create: "entry",
  edit: "entry",
  list: "entries"
};

export default Ember.View.extend({
  tagName: "",
  // We resolve the template based on the controllers templateName, and resolve
  templateName: function() {
    var name = this.get("_controller.templateName");
    var templateName = this.container.lookup("template:cms/" + name) ? "cms/" + name : name;
    console.log("Got template %o", templateName);
    return templateName;
  }.property("_controller.templateName")
});
