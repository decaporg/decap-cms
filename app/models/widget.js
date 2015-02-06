import Ember from 'ember';

var Validator = Ember.Object.extend({
  value: Ember.computed.alias("model.value"),
  isValid: function() {
    return this.validate(this.get("value"), this.options);
  }.property("model.value")
});

var Validators = {
  presence: Validator.extend({
    validate: function(value, options) {
      if (options === false) { return true; }
      return !!value;
    }
  })
};

window.CMSWidget = Ember.Object.extend({
  dirty: false,

  init: function() {
    this._super();
    var validators = Ember.A();
    if (this.isRequired()) {
      validators.pushObject(Validators.presence.create({model: this, options: true}));
    }
    this.validators = validators;
  },

  isRequired: function() {
    if (this.field.widget === 'checkbox' || this.field.optional) { return false; }
    return this.field.options !== true;
  },

  registerValidator: function(validFn) {
    this.validators.pushObject(Validator.create({model: this, validate: validFn}));
  },

  isValid: function() {
    return this.get("validators").every(function(validator) { return validator.get("isValid"); });
  }.property("validators.@each.isValid"),

  isInvalid: Ember.computed.not('isValid'),

  dirtyAndInvalid: function() {
    return this.get("dirty") && this.get("isInvalid");
  }.property("dirty", "isInvalid"),

  field: null,
  entry: null,
  value: null,

  name: Ember.computed.alias("field.name"),
  label: Ember.computed.alias("field.label"),
  type: Ember.computed.alias("field.widget"),

  getValue: function() {
    return this.get("value");
  },

  onValuechange: function() {
    this.set("dirty", true);
    if (this.entry) {
      this.entry.set(this.get("name"), this.getValue());
    }
  }.observes("value"),

  clear: function() {
    this.set("dirty", false);
  }
});

export default window.CMSWidget;

export {Validators};