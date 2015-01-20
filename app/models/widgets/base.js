import Ember from 'ember';

var Validator = Ember.Object.extend({
  value: Ember.computed.alias("model.value"),
  isValid: function() {
    return this.validate();
  }.property("model.value")
});

var Validators = {
  presence: Validator.extend({
    validate: function() {
      if (this.options === false) { return true; }
      return !!this.get("value");
    }
  }),
  date: Validator.extend({
    validate: function() {
      return !isNaN(this.get("value"));
    }
  })
};

window.CMSWidget = Ember.Object.extend({
  dirty: false,

  init: function() {
    this._super();
    var validators = Ember.A();
    if (this.field.optional !== true) {
      validators.pushObject(Validators.presence.create({model: this, options: true}));
    }

    this.validators = validators;
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
    this.get("entry")[this.get("name")] = this.getValue();
  }.observes("value"),

  clear: function() {
    this.set("dirty", false);
  }
});

window.CMSWidget.reopenClass({
  widgetFor: function(container, field, entry, value) {
    var model = container.resolve("model:widgets/" + field.widget) || container.resolve("model:widgets/base");
    return model.create({
      field: field,
      entry: entry,
      value: value || entry[field.name] || null
    });
  }
});

export default window.CMSWidget;

export {Validators};