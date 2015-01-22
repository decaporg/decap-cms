import Ember from 'ember';

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
    this.appendChild(component.create({widget: this.widget}));
  }
});
