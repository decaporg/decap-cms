import Ember from 'ember';

export default Ember.Component.extend({
  tagName: "",
  init: function() {
    this._super();
  },
  render: function() {
    var type = this.widget.get("type");
    var componentLookup = this.container.lookup("component-lookup:main");
    var customName = "cms-widget-" + type + "-control";
    var defaultName = "cms-widget-control";
    var component = componentLookup.lookupFactory(customName, this.container) || componentLookup.lookupFactory(defaultName, this.container);
    this.appendChild(component.create({widget: this.widget}));
  }
});
