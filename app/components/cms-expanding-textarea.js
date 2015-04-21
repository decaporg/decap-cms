import Ember from 'ember';

/**
@module app
@submodule components
*/

/**
  A textarea that will expand to fit its contents.

  ## Usage:

  ```
  {{cms-expanding-texarea value=value}}
  ```

  @class CmsExpandingTextarea
  @extends Ember.TextArea
*/
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
