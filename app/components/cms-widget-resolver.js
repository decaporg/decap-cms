import Ember from 'ember';

/**
@module app
@submodule widgets
*/

/**
  This is a base class for the widget control and preview, and handles resolving
  the right components based on the type of the widget.

  @class CmsWidgeResolver
  @extends Ember.Component
*/
export default Ember.Component.extend({
  tagName: "",
  init: function() {
    this._super();
  },
  lookupFactory: function(fullName, container) {
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
  render: function() {
    var component = this.lookupFactory(`cms/widgets/${this.name()}`) ||
                    this.lookupFactory(`components/widgets/${this.name()}`) ||
                    this.lookupFactory(`components/widgets/${this.noName()}`);

    var instance = component.create({widget: this.widget});
    if (instance.tagName === null) {
      instance.set("tagName", "");
    }
    this.appendChild(instance);
  }
});
