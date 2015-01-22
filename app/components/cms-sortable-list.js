import Ember from 'ember';

export default Ember.Component.extend({
  tagName: 'ul',
  classNames: ['cms-list'],
  sortableItems: function() {
    var id = this.get("id") || "id";
    console.log("updating items %o %s", this.get("items"), id);
    return this.get("items").map(function(item) {
      return {id: item[id], item: item};
    });
  }.property("items.@each"),

  extraxtOriginalItems: function(items) {
    return items.map(function(item) { return item.item; });
  },

  didInsertElement: function() {
    this.$().sortable({
      placeholder: "<li class='cms-list-placeholder'/>",
      itemSelector: ".cms-list-item",
      onDrop: function($item, container, _super) {
        _super($item, container);
        var items = this.get("sortableItems");
        var newItems = Ember.A();
        var itemLookup = {};
        for (var i=0, len=items.length; i<len; i++) {
          itemLookup[items[i].id] = items[i];
        }
        this.$().children(".cms-list-item").each(function() {
          newItems.push(itemLookup[Ember.$(this).data("item")]);
        });
        this.sendAction("action", this.extraxtOriginalItems(newItems));
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
    var newItems = this.get("sortableItems");
    for (var i=0; i<newItems.length; i++) {
      if (newItems[i].id === item.id) {
        swapWith = newItems[i+direction];
        index  = i;
        break;
      }
    }
    if (swapWith) {
      if (direction < 0 ) {
        newItems.replace(index-1, 2, [item, swapWith]);
      } else {
        newItems.replace(index, 2, [swapWith, item]);
      }
    }
    this.sendAction("action", this.extraxtOriginalItems(newItems));
  },

  actions: {
    removeItem: function(item) {
      var newItems = this.get("sortableItems").reject(function(i) { return i.id === item.id; });
      this.sendAction("action", this.extraxtOriginalItems(newItems));
    },
    moveUp: function(item) {
      this._moveItem(item, -1);
    },
    moveDown: function(item) {
      this._moveItem(item, 1);
    },
  }
});