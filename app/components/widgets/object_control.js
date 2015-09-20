import Ember from 'ember';
import Item from '../../models/item';

/**
 A single object. Gives the user a grouped set of fields.

 @class ObjectControl
 @extends Ember.Component
 */
export default Ember.Component.extend({
  init: function() {
    this._super.apply(this, arguments);
    this.set("widget.item", Item.create({
      widget: this.get("widget"),
      value: this.get("widget.value") || {}
    }));
    this.get("widget").registerValidator(function() {
      var item = this.get("widget.item");
      return item && item.isEmpty() || item.isValid();
    }.bind(this));
    this.set("item", this.get("widget.item"));
  },

  collapsed: false,

  /*
    Update the value of the widget whenever the value of one of the item
    change.
  */
  didUpdateItem: function() {
    this.set("widget.value", this.get("widget.item.value"));
  }.observes("widget.item.value"),

  actions: {
    toggleCollapse: function() {
      this.set("collapsed", !this.get("collapsed"));
    }
  }
});
