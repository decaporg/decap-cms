"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TYPE_KEY = exports.TYPES_KEY = exports.DEFAULT_TYPE_KEY = void 0;
exports.getErrorMessageForTypedFieldAndValue = getErrorMessageForTypedFieldAndValue;
exports.getTypedFieldForValue = getTypedFieldForValue;
exports.resolveFieldKeyType = resolveFieldKeyType;
exports.resolveFunctionForTypedField = resolveFunctionForTypedField;
const TYPES_KEY = 'types';
exports.TYPES_KEY = TYPES_KEY;
const TYPE_KEY = 'typeKey';
exports.TYPE_KEY = TYPE_KEY;
const DEFAULT_TYPE_KEY = 'type';
exports.DEFAULT_TYPE_KEY = DEFAULT_TYPE_KEY;
function getTypedFieldForValue(field, value) {
  const typeKey = resolveFieldKeyType(field);
  const types = field.get(TYPES_KEY);
  const valueType = value.get(typeKey);
  return types.find(type => type.get('name') === valueType);
}
function resolveFunctionForTypedField(field) {
  const typeKey = resolveFieldKeyType(field);
  const types = field.get(TYPES_KEY);
  return value => {
    const valueType = value.get(typeKey);
    return types.find(type => type.get('name') === valueType);
  };
}
function resolveFieldKeyType(field) {
  return field.get(TYPE_KEY, DEFAULT_TYPE_KEY);
}
function getErrorMessageForTypedFieldAndValue(field, value) {
  const keyType = resolveFieldKeyType(field);
  const type = value.get(keyType);
  let errorMessage;
  if (!type) {
    errorMessage = `Error: item has no '${keyType}' property`;
  } else {
    errorMessage = `Error: item has illegal '${keyType}' property: '${type}'`;
  }
  return errorMessage;
}