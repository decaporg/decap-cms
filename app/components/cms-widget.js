import Ember from 'ember';

/**
@module app
@submodule widgets
*/

/**
  The UI for a widget.

  

  @class CmsWidget
  @extends Ember.Component
*/
export default Ember.Component.extend({
  tagName: "",
  layoutName: function() {
    return this.container && this.container.lookup("template:cms/components/widget") ? "cms/components/widget" : "components/widget";
  }.property("widget")
});
