export default {
  fromFile(content) {
    return JSON.parse(content);
  },

  toFile(data) {
    return JSON.stringify(data, null, 2);
  }
}
