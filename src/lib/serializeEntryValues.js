import { isArray, isObject, isEmpty, isNil } from 'lodash';
import { Map, List } from 'immutable';
import registry from './registry';

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

const runSerializer = (values, fields, method) => {
  return fields.reduce((acc, field) => {
    const fieldName = field.get('name');
    const value = values.get(fieldName);
    const serializer = registry.getWidgetValueSerializer(field.get('widget'));
    const nestedFields = field.get('fields');
    if (nestedFields && List.isList(value)) {
      return acc.set(fieldName, value.map(val => runSerializer(val, nestedFields, method)));
    } else if (nestedFields && Map.isMap(value)) {
      return acc.set(fieldName, runSerializer(value, nestedFields, method));
    } else if (serializer && !isNil(value)) {
      return acc.set(fieldName, serializer[method](value));
    } else if (!isNil(value)) {
      return acc.set(fieldName, value);
    }
    return acc;
  }, Map());
};

export const serializeValues = (values, fields) => {
  return runSerializer(values, fields, 'serialize');
};

export const deserializeValues = (values, fields) => {
  return runSerializer(values, fields, 'deserialize');
};
