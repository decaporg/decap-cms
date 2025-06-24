export default {
  fromFile(content: string) {
    return JSON.parse(content);
  },

  toFile(data: object) {
    return JSON.stringify(data, null, 2);
  },
};
