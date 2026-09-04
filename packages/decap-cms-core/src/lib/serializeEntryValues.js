import isNil from 'lodash/isNil';
import { Map, List } from 'immutable';

import { getWidgetValueSerializer } from './registry';

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
function runSerializer(
  values,
  fields,
  method,
  removeEmptyFields = [],
  pathsToRemove = [],
  currentPath = [],
) {
  /**
   * Reduce the list of fields to a map where keys are field names and values
   * are field values, serializing the values of fields whose widgets have
   * registered serializers.  If the field is a list or object, call recursively
   * for nested fields.
   */
  const serializedData = fields.reduce((acc, field) => {
    const fieldName = field.get('name');
    const value = values.get(fieldName);
    const widget = field.get('widget', 'string');
    const serializer = getWidgetValueSerializer(widget);
    const nestedFields = field.get('fields');
    const newPath = [...currentPath, fieldName];

    // Call recursively for fields within lists
    if (nestedFields && List.isList(value)) {
      return acc.set(
        fieldName,
        value.map((val, index) =>
          runSerializer(val, nestedFields, method, removeEmptyFields, pathsToRemove, [
            ...newPath,
            index,
          ]),
        ),
      );
    }

    // Call recursively for fields within objects
    if (nestedFields && Map.isMap(value)) {
      return acc.set(
        fieldName,
        runSerializer(value, nestedFields, method, removeEmptyFields, pathsToRemove, newPath),
      );
    }

    if (removeEmptyFields.includes(widget) && (isNil(value) || value === '')) {
      pathsToRemove.push(newPath);
      return acc;
    }

    // Run serialization method on value if not null or undefined
    if (serializer && !isNil(value)) {
      return acc.set(fieldName, serializer[method](value));
    }

    // If no serializer is registered for the field's widget, use the field as is
    if (!isNil(value)) {
      return acc.set(fieldName, value);
    }

    return acc;
  }, Map());

  // preserve unknown fields value
  return values.mergeDeep(serializedData);
}

function removeEntriesByPaths(data, paths) {
  paths.forEach(path => {
    data = removeEntryByPath(data, path);
  });
  return data;
}

function removeEntryByPath(data, keys) {
  if (keys.length === 1) {
    return data.delete(keys[0]);
  }

  const [firstKey, ...restKeys] = keys;
  const nestedData = data.get(firstKey);

  if (nestedData) {
    const updatedNestedData = removeEntryByPath(nestedData, restKeys);
    return data.set(firstKey, updatedNestedData);
  }

  return data;
}

export function serializeValues(values, fields, config) {
  const pathsToRemove = [];
  const serializedValues = runSerializer(
    values,
    fields,
    'serialize',
    config?.remove_empty_fields,
    pathsToRemove,
  );
  return removeEntriesByPaths(serializedValues, pathsToRemove);
}

export function deserializeValues(values, fields) {
  return runSerializer(values, fields, 'deserialize');
}
