import Ember from 'ember';

import Widget from '../../models/widget';

var Item = Ember.Object.extend({
  id: null,
  widgets: null,
  isValid: function() {
    return this.get("widgets").every(function(widget) { return widget.get("isValid"); });
  },
  isEmpty: function() {
    return this.get("widgets").every(function(widget) { return !widget.get("value"); });
  },
  valueDidChange: function() {
    var value = {};
    this.get("widgets").forEach(function(widget) {
      value[widget.get("name")] = widget.getValue();
    });
    this.set("value", value);
  }.observes("widgets.@each.value")
});

export default Ember.Component.extend({
  _itemId: 0,
  _newItem: function(value) {
    var fields = this.get("widget.field.fields");
    var widgets = [];
    var item = Item.create({id: ++this._itemId, value: Ember.$.extend({}, value)});

    for (var i=0; i<fields.length; i++) {

      widgets.push(Widget.create({
        field: fields[i],
        value: value && value[fields[i].name],
        entry: null
      }));
    }

    item.set("widgets", widgets);

    return item;
  },

  init: function() {
    this._super.apply(this, arguments);
    var items = Ember.A();
    var values = this.get("widget.value");
    if (values && values.length) {
      for (var i=0; i<values.length; i++) {
        items.pushObject(this._newItem(values[i]));
      }
    } else {
      items.pushObject(this._newItem());
    }
    this.set("widget.items", items);
    this.set("widget.addLabel", "Add " + (this.get("widget.item_label") || "one"))
    this.didUpdateItem();
    this.widget.registerValidator(function() {
      var items = this.get("widget.items");
      return items && items.every(function(item) {
        return item.isEmpty() || item.isValid();
      });
    }.bind(this));
  },

  didUpdateItem: function() {
    var value = [];
    this.get("widget.items").forEach(function(item) {
      if (item.isEmpty()) { return; }
      value.push(item.get("value"));
    });
    this.set("widget.value", value);
  }.observes("widget.items.@each.value"),


  actions: {
    addItem: function() {
      this.get("widget.items").pushObject(this._newItem());
    },
    reorder: function(items) {
      this.set("widget.items", items);
    }
  }
});
