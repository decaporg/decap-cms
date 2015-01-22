import Resolver from './cms-widget-resolver';

export default Resolver.extend({
  init: function() {
    this._super();
    this.set("tagName", this.get("widget.field.tagname") || "div");
    this.set("classNames", (this.get("widget.field.class") || "").split(" "));
  },
  customName: function() {
    return "cms/widgets/" + (this.widget.get("field.preview") || this.widget.get("type") + "-preview");
  },
  defaultName: function() {
    return "widgets/" + (this.widget.get("field.preview") || this.widget.get("type") + "-preview");
  },
  noName: function() {
    return "widgets/string-preview";
  }
});
