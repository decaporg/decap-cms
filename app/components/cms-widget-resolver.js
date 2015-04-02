import Ember from 'ember';

export default Ember.Component.extend({
  tagName: "",
  init: function() {
    this._super();
  },
  render: function() {
    var componentLookup = this.container.lookup("component-lookup:main");
    console.log("Looking for %s, %o", this.customName(), this.container);
    var component = componentLookup.lookupFactory(this.customName(), this.container) ||
                    componentLookup.lookupFactory(this.defaultName(), this.container) ||
                    componentLookup.lookupFactory(this.noName(), this.container);
    console.log("Got component: %o", component);
    var instance = component.create({widget: this.widget});
    if (instance.tagName === null) {
      instance.set("tagName", "");
    }
    this.appendChild(instance);
  }
});
