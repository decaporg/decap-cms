function orderKeys(data: object, sortedKeys: string[]) {
  if (sortedKeys.length === 0 || data === null || Array.isArray(data)) {
    return data;
  }

  const record = data as Record<string, unknown>;
  const ordered: Record<string, unknown> = {};
  sortedKeys.forEach(key => {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      ordered[key] = record[key];
    }
  });
  Object.keys(record).forEach(key => {
    if (!Object.prototype.hasOwnProperty.call(ordered, key)) {
      ordered[key] = record[key];
    }
  });
  return ordered;
}

export default {
  fromFile(content: string) {
    return JSON.parse(content);
  },

  toFile(data: object, sortedKeys: string[] = []) {
    return JSON.stringify(orderKeys(data, sortedKeys), null, 2);
  },
};
