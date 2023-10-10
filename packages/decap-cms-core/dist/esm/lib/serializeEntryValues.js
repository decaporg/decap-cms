"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.deserializeValues = deserializeValues;
exports.serializeValues = serializeValues;
var _isNil2 = _interopRequireDefault(require("lodash/isNil"));
var _immutable = require("immutable");
var _registry = require("./registry");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Methods for serializing/deserializing entry field values. Most widgets don't
 * require this for their values, and those that do can typically serialize/
 * deserialize on every change from within the widget. The serialization
 * handlers here are for widgets whose values require heavy serialization that
 * would hurt performance if run for every change.

 * An example of this is the markdown widget, whose value is stored as a
 * markdown string. Instead of stringifying on every change of that field, a
 * deserialization method is registered from the widget's control module that
 * converts the stored markdown string to an AST, and that AST serves as the
 * widget model during editing.
 *
 * Serialization handlers should be registered for each widget that requires
 * them, and the registration method is exposed through the registry. Any
 * registered deserialization handlers run on entry load, and serialization
 * handlers run on persist.
 */
function runSerializer(values, fields, method) {
  /**
   * Reduce the list of fields to a map where keys are field names and values
   * are field values, serializing the values of fields whose widgets have
   * registered serializers.  If the field is a list or object, call recursively
   * for nested fields.
   */
  let serializedData = fields.reduce((acc, field) => {
    const fieldName = field.get('name');
    const value = values.get(fieldName);
    const serializer = (0, _registry.getWidgetValueSerializer)(field.get('widget'));
    const nestedFields = field.get('fields');

    // Call recursively for fields within lists
    if (nestedFields && _immutable.List.isList(value)) {
      return acc.set(fieldName, value.map(val => runSerializer(val, nestedFields, method)));
    }

    // Call recursively for fields within objects
    if (nestedFields && _immutable.Map.isMap(value)) {
      return acc.set(fieldName, runSerializer(value, nestedFields, method));
    }

    // Run serialization method on value if not null or undefined
    if (serializer && !(0, _isNil2.default)(value)) {
      return acc.set(fieldName, serializer[method](value));
    }

    // If no serializer is registered for the field's widget, use the field as is
    if (!(0, _isNil2.default)(value)) {
      return acc.set(fieldName, value);
    }
    return acc;
  }, (0, _immutable.Map)());

  //preserve unknown fields value
  serializedData = values.mergeDeep(serializedData);
  return serializedData;
}
function serializeValues(values, fields) {
  return runSerializer(values, fields, 'serialize');
}
function deserializeValues(values, fields) {
  return runSerializer(values, fields, 'deserialize');
}