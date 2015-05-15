import Ember from 'ember';

/**
@module app
@submodule widgets
*/

/**
  This is a base class for the widget control and preview, and handles resolving
  the right components based on the type of the widget.

  The Widget Control and Widget Preview components can be thought of as meta-components.

  In themselves they don't add anything to the DOM, they merely resolve the right
  control or preview component for a widget and inserts those components to the DOM.

  The resolver base class finds the right component, instantiates it and and adds
  it as a child view.

  @class CmsWidgetResolver
  @extends Ember.Component
*/
export default Ember.Component.extend({
  tagName: "",
  componentLookupFactory: function(fullName, container) {
    container = container || this.container;

    var componentFullName = `component:${fullName.replace(/^components\//, '')}`
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
  //componentName: function() {
  render: function() {
    var component = this.componentLookupFactory(`cms/widgets/${this.name()}`) ||
                    this.componentLookupFactory(`components/widgets/${this.name()}`) ||
                    this.componentLookupFactory(`components/widgets/${this.noName()}`);

    console.log(component.toString().split(":")[1]);
    return component.toString().split(":")[1];
    // var instance = this.createChildView(component, {widget: this.get("widget")});
    //
    // //component.create({widget: this.get("widget")});
    //
    // if (instance.tagName === null) {
    //   instance.set("tagName", "");
    // }
    // this.appendChild(instance);
  }
});
