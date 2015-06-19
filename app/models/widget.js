import Ember from 'ember';


var Validator = Ember.Object.extend({
  value: Ember.computed.alias("model.value"),
  isValid: function() {
    return this.validate(this.get("value"), this.options);
  }.property("model.value")
});

/* Built in validators. Just `presence` right now */
var Validators = {
  presence: Validator.extend({
    validate: function(value, options) {
      if (options === false) { return true; }
      return !!value;
    }
  })
};

/**
  Each field for an entry or a document in a collection has a `Widget` that
  represents the UI for entering the value of that field.

  @class Widget
  @extends Ember.Object
*/
var Widget = Ember.Object.extend({
  /**
    True if the value of this widget has been modified

    @property dirty
    @type Boolean
  */
  dirty: false,

  /**
    The field that this widget reflects the value of

    @property field
    @type Object
  */
  field: null,

  /**
    The entry the widget belongs to. Useful if a preview or a validation
    depends on another value (a field might be required only if a checkbox is
    checked).

    @property entry
    @type Entry
  */
  entry: null,

  /**
    The current value of the widget

    @property value
  */
  value: null,

  /**
    The name of the field this widget represents

    @property name
    @type String
  */
  name: Ember.computed.alias("field.name"),

  /**
    The label of the field this widget represents

    @property label
    @type String
  */
  label: Ember.computed.alias("field.label"),

  /**
    The type of the field this widget represents (the name of the widget)

    @property type
    @type String
  */
  type: Ember.computed.alias("field.widget"),

  /**
    True if the widget is hidden and should not show up in the ui.

    @property hidden
    @type Boolean
  */
  hidden: function() {
    return this.get("field.widget") === "hidden";
  }.property("field.widget"),

  collection: Ember.computed.alias("entry._collection"),

  mediaFolder: function() {
    console.log("Getting widget media folder");
    return this.get("field.media_folder") || this.get("collection.mediaFolder");
  }.property("collection", "field.media_folder"),

  /* Set up the validators forthis widget */
  init: function() {
    this._super();
    var validators = Ember.A();
    if (this.isRequired()) {
      validators.pushObject(Validators.presence.create({model: this, options: true}));
    }
    this.validators = validators;
  },

  /**
    Add a validator to the widget.

    If you're creating your own component for the controller of the widget, this
    method can be used to add a validator to the widget itself that needs to be
    valid before the entry can be saved.

    A validFn will receive the `value` of the widget and must return true if it is
    valid.

    @method registerValidator
    @param {Function} validFn
  */
  registerValidator: function(validFn) {
    this.validators.pushObject(Validator.create({model: this, validate: validFn}));
  },

  /**
    Whether the value of this widget is required optional.

    @property isRequired
    @type Boolean
  */
  isRequired: function() {
    if (this.field.widget === 'checkbox' || this.field.optional) { return false; }
    return this.field.options !== true;
  },

  /**
    True if the value of the widget is valid

    @property isValid
    @type Boolean
  */
  isValid: function() {
    return this.get("validators").every(function(validator) { return validator.get("isValid"); });
  }.property("validators.@each.isValid"),

  /**
    false if the value of the widget is valid

    @property isInvalid
    @type Boolean
  */
  isInvalid: Ember.computed.not('isValid'),

  /**
    true if the widget is both dirty and invalid.

    @property dirtyAndInvalid
    @type Boolean
  */
  dirtyAndInvalid: function() {
    return this.get("dirty") && this.get("isInvalid");
  }.property("dirty", "isInvalid"),

  /*
    Small helper function to `get` the value
  */
  getValue: function() {
    return this.get("value");
  },

  /*
    Update the corresponding value on the enrty whenever the value changes.
  */
  onValuechange: function() {
    var name  = this.get("name"),
        value = this.get("value");
    this.set("dirty", true);
    if (this.entry) {
      this.entry.set(name, value);
    }
  }.observes("value")
});

export default Widget;

export {Validators};
