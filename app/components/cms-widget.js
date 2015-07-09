import Ember from 'ember';

/**
@module app
@submodule widgets
*/

/**
  The base widget UI cmponent

  The default temlate sets up a widget control and a widget preview for each widget.

  The template can be overwritten by any "cms/widget" template defined when integrating
  the CMS.

  @class CmsWidget
  @extends Ember.Component
*/
export default Ember.Component.extend({
  componentLookupFactory: function(fullName, container) {
    container = container || this.container;

    var componentFullName = `component:${fullName.replace(/^components\//, '')}`;
    var templateFullName = `template:${fullName}`;
    var templateRegistered = container && container._registry.has(templateFullName);

    if (templateRegistered) {
      container._registry.injection(componentFullName, 'layout', templateFullName);
    }

    var Component = container.lookupFactory(componentFullName);

    // Only treat as a component if either the component
    // or a template has been registered.
    if (templateRegistered || Component) {
      if (!Component) {
        container._registry.register(componentFullName, Ember.Component);
        Component = container.lookupFactory(componentFullName);
      }
      return Component;
    }
  },

  tagName: "",
  type: "control",
  isControl: function() {
    return this.get("type") === "control";
  }.property("type"),
  previewTagName: function() {
    var field = this.get("widget.field");
    return field.hasOwnProperty("tagname") ? field.tagname : "div";
  }.property("widget"),
  previewClassNames: function() {
    return (this.get("widget.field.class") || "").split(" ");
  }.property("widget"),
  layoutName: function() {
    return this.container && this.container.lookup("template:cms/widget") ? "cms/widget" : "components/widget";
  }.property("widget"),
  component: function(name, defaultName) {
    var component = this.componentLookupFactory(`cms/widgets/${name}`) ||
                    this.componentLookupFactory(`components/widgets/${name}`) ||
                    this.componentLookupFactory(`components/widgets/${defaultName}`);


    return component && component.toString().split(":")[1];
  },
  controlComponent: function() {
    return this.component(this.get("widget.type") + "-control", "not-found-control");
  }.property("widget"),
  previewComponent: function() {
    var name = `${this.get("widget.field.preview") || this.get("widget.type")}-preview`;
    return this.component(name, "string-preview");
  }.property("widget")
});
