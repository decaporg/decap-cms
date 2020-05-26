export const keyToPathArray = (key?: string) => {
  if (!key) {
    return [];
  }
  const parts = [];
  const separator = '';
  const chars = key.split(separator);

  let currentChar;
  let currentStr = [];
  while ((currentChar = chars.shift())) {
    if (['[', ']', '.'].includes(currentChar)) {
      if (currentStr.length > 0) {
        parts.push(currentStr.join(separator));
      }
      currentStr = [];
    } else {
      currentStr.push(currentChar);
    }
  }
  if (currentStr.length > 0) {
    parts.push(currentStr.join(separator));
  }
  return parts;
};
