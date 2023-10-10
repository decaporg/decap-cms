"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _yaml = _interopRequireDefault(require("yaml"));
var _helpers = require("./helpers");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function addComments(items, comments, prefix = '') {
  items.forEach(item => {
    if (item.key !== undefined) {
      var _item$value;
      const itemKey = item.key.toString();
      const key = prefix ? `${prefix}.${itemKey}` : itemKey;
      if (comments[key]) {
        const value = comments[key].split('\\n').join('\n ');
        item.commentBefore = ` ${value}`;
      }
      if (Array.isArray((_item$value = item.value) === null || _item$value === void 0 ? void 0 : _item$value.items)) {
        addComments(item.value.items, comments, key);
      }
    }
  });
}
const timestampTag = {
  identify: value => value instanceof Date,
  default: true,
  tag: '!timestamp',
  test: RegExp('^' + '([0-9]{4})-([0-9]{2})-([0-9]{2})' +
  // YYYY-MM-DD
  'T' +
  // T
  '([0-9]{2}):([0-9]{2}):([0-9]{2}(\\.[0-9]+)?)' +
  // HH:MM:SS(.ss)?
  'Z' +
  // Z
  '$'),
  resolve: str => new Date(str),
  stringify: value => value.toISOString()
};
var _default = {
  fromFile(content) {
    if (content && content.trim().endsWith('---')) {
      content = content.trim().slice(0, -3);
    }
    return _yaml.default.parse(content, {
      customTags: [timestampTag]
    });
  },
  toFile(data, sortedKeys = [], comments = {}) {
    const contents = _yaml.default.createNode(data);
    addComments(contents.items, comments);
    contents.items.sort((0, _helpers.sortKeys)(sortedKeys, item => {
      var _item$key;
      return (_item$key = item.key) === null || _item$key === void 0 ? void 0 : _item$key.toString();
    }));
    const doc = new _yaml.default.Document();
    doc.contents = contents;
    return doc.toString();
  }
};
exports.default = _default;