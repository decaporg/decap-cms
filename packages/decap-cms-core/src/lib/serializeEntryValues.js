import { isNil } from 'lodash';
import { Map, List } from 'immutable';

import { getWidgetValueSerializer } from './registry';

const FLAG_REMOVE_ENTRY = '!~FLAG_REMOVE_ENTRY~!';
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
function runSerializer(values, fields, method, config = {}, isRecursive = false) {
  /**
   * Reduce the list of fields to a map where keys are field names and values
   * are field values, serializing the values of fields whose widgets have
   * registered serializers.  If the field is a list or object, call recursively
   * for nested fields.
   */
  let serializedData = fields.reduce((acc, field) => {
    const fieldName = field.get('name');
    const value = values.get(fieldName);
    const serializer = getWidgetValueSerializer(field.get('widget'));
    const nestedFields = field.get('fields');

    // Call recursively for fields within lists
    if (nestedFields && List.isList(value)) {
      return acc.set(
        fieldName,
        value.map(val => runSerializer(val, nestedFields, method, config, true)),
      );
    }

    // Call recursively for fields within objects
    if (nestedFields && Map.isMap(value)) {
      return acc.set(fieldName, runSerializer(value, nestedFields, method, config, true));
    }

    // Run serialization method on value if not null or undefined
    if (serializer && !isNil(value)) {
      return acc.set(fieldName, serializer[method](value));
    }

    // If widget is image with no value set, flag field for removal
    if (config.remove_empty_image_field && !value && field.get('widget') === 'image') {
      return acc.set(fieldName, FLAG_REMOVE_ENTRY);
    }

    // If no serializer is registered for the field's widget, use the field as is
    if (!isNil(value)) {
      return acc.set(fieldName, value);
    }

    return acc;
  }, Map());

  // preserve unknown fields value
  serializedData = values.mergeDeep(serializedData);

  // Remove only on the top level, otherwise `mergeDeep` will reinsert them.
  if (config.remove_empty_image_field && !isRecursive) {
    serializedData = serializedData.map(v => removeEntriesRecursive(v))
      .filter(v => v !== FLAG_REMOVE_ENTRY);
  }

  return serializedData;
}

function removeEntriesRecursive(entry) {
  if (List.isList(entry)) {
    return entry.map(v => removeEntriesRecursive(v)).filter(v => v !== FLAG_REMOVE_ENTRY);
  } else if (Map.isMap(entry)) {
    let updatedEntry = entry;
    entry.forEach((v, k) => {
      if (Map.isMap(v) || List.isList(v)) {
        updatedEntry = updatedEntry.set(k, removeEntriesRecursive(v));
      } else if (v === FLAG_REMOVE_ENTRY) {
        updatedEntry = updatedEntry.delete(k);
      }
    });
    return updatedEntry;
  }
  return entry;
}

export function serializeValues(values, fields, config) {
  return runSerializer(values, fields, 'serialize', config);
}

export function deserializeValues(values, fields) {
  return runSerializer(values, fields, 'deserialize');
}
