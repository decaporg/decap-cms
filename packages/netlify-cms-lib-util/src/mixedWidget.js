export const TYPES_KEY = 'types';
export const TYPE_KEY = 'typeKey';
export const DEFAULT_TYPE_KEY = 'type';

export function getTypedFieldForValue(field, value) {
  const typeKey = resolveFieldKeyType(field);
  const types = field.get(TYPES_KEY);
  const valueType = value.get(typeKey);
  return types.find(type => type.get('name') === valueType);
}

export function resolveFunctionForMixedField(field) {
  const typeKey = resolveFieldKeyType(field);
  const types = field.get(TYPES_KEY);
  return (value) => {
    const valueType = value.get(typeKey);
    return types.find(type => type.get('name') === valueType);
  }
}

export function resolveFieldKeyType(field) {
  return field.get(TYPE_KEY, DEFAULT_TYPE_KEY);
}
