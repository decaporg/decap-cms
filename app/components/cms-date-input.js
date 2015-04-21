import Ember from 'ember';
 /* global moment */

/**
@module app
@submodule components
*/

/**
  An input field for dates. Will make sure the dat format gets stores as YYYY-MM-DD

  ## Usage:

  ```
  {{cms-date-input value=value}}
  ```

  @class CmsDateInput
  @extends Ember.TextField
*/
export default Ember.TextField.extend({
  init: function() {
    this._super();
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
