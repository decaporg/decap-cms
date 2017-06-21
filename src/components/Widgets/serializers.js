export const controlValueSerializers = {};

export const registerControlValueSerializer = (fieldName, serializer) => {
  controlValueSerializers[fieldName] = serializer;
};
