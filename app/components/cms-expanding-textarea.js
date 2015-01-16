import Ember from 'ember';

export default Ember.TextArea.extend({
  valueChanged: function() {
    if (this.element.scrollHeight > this.element.clientHeight) {
      this.element.style.height = this.element.scrollHeight + "px";
    }
  }.observes("value"),

  didInsertElement: function() {
    this.valueChanged();
  }
});