import Ember from 'ember';

export default Ember.TextField.extend({
  MAX_FILE_SIZE: 1024 * 1024 * 10, // 10MB
  type: 'file',
  classNames: ['cms-file-field'],
  attributeBindings: ['multiple'],
  change: function() {
    this.sendAction('action', this.validFiles());
  },
  validFiles: function() {
    console.log("files: %o", this.element.files);
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