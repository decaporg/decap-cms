import Ember from 'ember';

/**
@module app
@submodule components
*/

/**
  A file upload field. Creates a dropzone for file uploads that can also be
  clicked to trigger a file browser dialog.

  Apart from the value

  ## Usage:

  ```htmlbars
  {{cms-file-field value=uploads multiple=true accept="image/*" action="fileUpload"}}
  ```

  The `multiple` attribute determines whether the dropzone will accept multiple
  files or just one.

  The `accept` attribute is a comma separated list of mimetypes that can be uploaded.

  Triggers an `action` when new files are droped into the dropzone or selected via
  the file browser.

  @class CmsFileField
  @extends Ember.TextField
*/
export default Ember.TextField.extend({
  MAX_FILE_SIZE: 1024 * 1024 * 10, // 10MB
  type: 'file',
  classNames: ['cms-file-field'],
  attributeBindings: ['multiple'],
  change: function() {
    this.sendAction('action', this.validFiles());
  },
  validFiles: function() {
    return Array.prototype.filter.call(this.element.files, function(file) {
      return this.validateAccept(file) && this.validateSize(file);
    }.bind(this));
  },
  validateAccept: function(file) {
    if (!this.accept) { return true; }
    var i, len, rule;
    var rules = this.accept.split(",");
    for (i=0, len=rules.length; i<len; i++) {
      rule = rules[i].trim();
      if (rule.indexOf(".") === 0 && file.name.split(".").pop() === rule) {
        return true;
      }
      if (rule === file.type) {
        return true;
      }
      if (rule.match(/^[^\/]+\/\*$/) && file.type.split("/").shift() === rule.split("/").shift()) {
        return true;
      }
    }
    return false;
  },
  validateSize: function(file) {
    return file.size < this.MAX_FILE_SIZE;
  }
});
