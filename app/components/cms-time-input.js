import Ember from 'ember';

/**
@module app
@submodule components
*/

/**
  An input field for a time (ie, 10:00pm).

  ## Usage:

  ```
  {{cms-time-input value=value}}
  ```

  @class CmsTimeInput
  @extends Ember.TextField
*/
export default Ember.TextField.extend({
  didInsertElement: function() {
    this.$().timepicker({className: "cms cms-timepicker cms-text"});
  },

  willDestroyElement: function() {
    this.$().timepicker('remove');
  }
});
