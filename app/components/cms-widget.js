import Ember from 'ember';

/**
@module app
@submodule widgets
*/

/**
  The base widget UI cmponent

  The default temlate sets up a widget control and a widget preview for each widget.

  The template can be overwritten by any "cms/widget" template defined when integrating
  the CMS.

  @class CmsWidget
  @extends Ember.Component
*/
export default Ember.Component.extend({
  tagName: "",
  layoutName: function() {
    return this.container && this.container.lookup("template:cms/widget") ? "cms/widget" : "components/widget";
  }.property("widget")
});
