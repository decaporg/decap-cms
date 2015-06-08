import Ember from 'ember';

/**
@module app
@submodule components
*/

/**
  An entry form containing a set of widgets.

  Will autofocus the first input, textarea or select element in the form when
  rendered.

  @class CmsEntryForm
  @extends Ember.Component
*/
export default Ember.Component.extend({
  tagName: "form",
  classNames: ["cms-form", "cms-control-pane"],
  didInsertElement: function() {
    this.$("input,textarea,select").first().focus();
  },
  actions: {
    save: function() {
      this.sendAction();
    }
  }
});
