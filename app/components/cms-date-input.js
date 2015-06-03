import Ember from 'ember';
import Pikaday from 'npm:pikaday';
 /* global moment */

/**
@module app
@submodule components
*/

/**
  An input field for dates.

  ## Usage:

  ```
  {{cms-date-input value=value}}
  ```

  @class CmsDateInput
  @extends Ember.TextField
*/
export default Ember.TextField.extend({
  didInsertElement: function() {
    var picker = new Pikaday({ field: this.$()[0] });
    picker.setMoment(moment(this.get("value")));
    this.set("_picker", picker);
  },

  willDestroyElement: function() {
    var picker = this.get("_picker");
    if (picker) {
      picker.destroy();
    }
    this.set("_picker", null);
  }
});
