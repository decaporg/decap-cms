import Ember from 'ember';
 /* global moment */


export default Ember.TextField.extend({
  init: function() {
    this._super();
    console.log("Init - value: %o", this.get("value"));
    var value = this.get("value");
    if (value) {
      this.set("value", moment(value).utc().format(this.get("dateFormat")));
    }
  },
  type: 'date',
  placeholderBinding: 'dateFormat',
  dateFormat: function() {
    return "YYYY-MM-DD";
  }.property()
});