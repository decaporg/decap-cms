import Ember from 'ember';
import Field from '../models/field';

export default Ember.Component.extend({
  tagName: "ul",
  classNames: ["cms-list"],
  _itemId: 0,
  _newItem: function(value) {
    var item = {id: ++this._itemId, fields: []},
        field = null,
        fields = this.field.get("fields");

    for (var i=0; i<fields.length; i++) {
      field  = Ember.$.extend(true, {}, fields[i]);
      field.value = value && value[fields[i].name];
      item.fields.push(Field.create(field));
    }
    return item;
  },
  
  init: function() {
    this._super.apply(this, arguments);
    var field = this.get("field");
    var items = this.get("field.value");
    var newItems = Ember.A();
    if (items && items.length) {
      for (var i=0; i<items.length; i++) {
        newItems.pushObject(this._newItem(items[i]));
      }
      this.set("field.value", newItems);
    } else {
      newItems.pushObject(this._newItem());
      this.set("field.value", newItems);
    }
    field.getValue = function() {
      var obj, fields;
      var items = [];
      var value = this.get("value") || [];
      var emptyObj = function(obj) { return Object.keys(obj).every(function(key) { return obj[key] == null; }); };
      for (var i=0, len=value.length; i<len; i++) {
        obj = {};
        fields = value[i].fields;
        for (var j=0; j<fields.length; j++) {
          obj[fields[j].name] = fields[j].getValue();
        }
        if (!emptyObj(obj)) {
          items.push(obj);
        }
      }
      return items;
    };
  },

  didInsertElement: function() {
    this.$().sortable({
      placeholder: "<li class='cms-list-placeholder'/>",
      itemSelector: ".cms-list-item",
      onDrop: function($item, container, _super) {
        _super($item, container);
        var items = this.get("field.value");
        var newItems = Ember.A();
        var itemLookup = {};
        for (var i=0, len=items.length; i<len; i++) {
          itemLookup[items[i].id] = items[i];
        }
        this.$().children(".cms-list-item").each(function() {
          newItems.push(itemLookup[Ember.$(this).data("item")]);
        });
        this.set("field.value", newItems);
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
    var items = this.get("field.value");
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
      this.get("field.value").pushObject(this._newItem());
    },
    removeItem: function(item) {
      this.set("field.value", this.get("field.value").reject(function(i) { return i.id === item.id; }));
    },
    moveUp: function(item) {
      this._moveItem(item, -1);
    },
    moveDown: function(item) {
      this._moveItem(item, 1);
    }
  }
});