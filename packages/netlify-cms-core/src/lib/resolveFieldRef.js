/**
 * A fieldRef can be a string (for a top level field)
 * or an array (for a nested field).
 */
export function resolveFieldRef(entryData, fieldRef) {
  if (Array.isArray(fieldRef)) {
    return entryData.getIn(fieldRef);
  }
  return entryData.get(fieldRef);
}

/**
 * Converts a fieldRef, which may be an array if it is a nested field
 * to it's string representation
 */
export function fieldRefToString(fieldRef) {
  if (Array.isArray(fieldRef)) return fieldRef.join('.');
  return fieldRef;
}
