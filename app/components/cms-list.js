import Ember from 'ember';
import Widget from '../models/widgets/base';

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
  tagName: "ul",
  classNames: ["cms-list"],
  _itemId: 0,
  _newItem: function(value) {
    var widget;
    var fields = this.get("widget.field.fields");
    var widgets = [];
    var item = Item.create({id: ++this._itemId, value: Ember.$.extend({}, value)});

    for (var i=0; i<fields.length; i++) {
      widget = Widget.widgetFor(this.container, fields[i], null, value && value[fields[i].name]);
      widgets.push(widget);
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
    this.set("widget.value", []);
    this.set("widget.items", items);
    this.widget.registerValidator(function(value) {
      return this.get("widget.items").every(function(item) {
        console.log("Validating");
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

  didInsertElement: function() {
    this.$().sortable({
      placeholder: "<li class='cms-list-placeholder'/>",
      itemSelector: ".cms-list-item",
      onDrop: function($item, container, _super) {
        _super($item, container);
        var items = this.get("widget.items");
        var newItems = Ember.A();
        var itemLookup = {};
        for (var i=0, len=items.length; i<len; i++) {
          itemLookup[items[i].id] = items[i];
        }
        this.$().children(".cms-list-item").each(function() {
          newItems.push(itemLookup[Ember.$(this).data("item")]);
        });
        this.set("widget.items", newItems);
      }.bind(this),
      afterMove: function($placeholder, container, $closestItemOrContainer) {
        var css = {
          height: $closestItemOrContainer.height(),
          width: $closestItemOrContainer.width(),
        };
        $placeholder.css(css);
      }
    });
  },

  _moveItem: function(item, direction) {
    var swapWith, index;
    var items = this.get("widget.items");
    for (var i=0; i<items.length; i++) {
      if (items[i].id === item.id) {
        swapWith = items[i+direction];
        index  = i;
        break;
      }
    }
    if (swapWith) {
      if (direction < 0 ) {
        items.replace(index-1, 2, [item, swapWith]);
      } else {
        items.replace(index, 2, [swapWith, item]);
      }
      
    }
  },
  actions: {
    addItem: function() {
      this.get("widget.items").pushObject(this._newItem());
    },
    removeItem: function(item) {
      this.set("widget.items", this.get("widget.items").reject(function(i) { 
        return i.id === item.id;
      }));
    },
    moveUp: function(item) {
      this._moveItem(item, -1);
      console.log(this.get("widget.items"));
    },
    moveDown: function(item) {
      this._moveItem(item, 1);
    }
  }
});