import Widget from './base';
import {Validators} from './base';

export default Widget.extend({
  init: function() {
    this._super();
    this.set("stringValue", this.value && this.value.toString());
    this.validators.pushObject(Validators.date.create({model: this}));
  },
  onStrinValue: function() {
    this.set("value", new Date(this.get("stringValue")));
  }.observes("stringValue")
});