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
  render: function() {
    var componentLookup = this.container.lookup("component-lookup:main");
    var component = componentLookup.lookupFactory(this.customName(), this.container) ||
                    componentLookup.lookupFactory(this.defaultName(), this.container) ||
                    componentLookup.lookupFactory(this.noName(), this.container);

    var instance = component.create({widget: this.widget});
    if (instance.tagName === null) {
      instance.set("tagName", "");
    }
    this.appendChild(instance);
  }
});
