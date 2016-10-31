export default class JSONFormatter {
  fromFile(content) {
    return JSON.parse(content);
  }

  toFile(data) {
    return JSON.stringify(data);
  }
}
