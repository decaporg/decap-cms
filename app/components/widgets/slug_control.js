import Ember from 'ember';

/**
@module app
@submodule widgets
*/

/**
 Slug input. This will either calculate the slug or let the user input a slug.

 This widget type should not be used for any other field than the slug field.

 @class SlugControl
 @extends Ember.Component
 */
export default Ember.Component.extend({
  userValue: null,
  slug: Ember.computed("widget.entry.cmsUserSlug", "userValue", {
    get: function() {
      return this.get("userValue") || this.get("widget.entry.cmsUserSlug");
    },
    set: function(key, value) {
      this.set("widget.value", value);
      this.set("userValue", this.get("widget.value"));
      return value;
    }
  })
});
