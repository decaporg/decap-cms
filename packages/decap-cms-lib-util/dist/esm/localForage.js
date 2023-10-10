"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _localforage = _interopRequireDefault(require("localforage"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function localForageTest() {
  const testKey = 'localForageTest';
  _localforage.default.setItem(testKey, {
    expires: Date.now() + 300000
  }).then(() => {
    _localforage.default.removeItem(testKey);
  }).catch(err => {
    if (err.code === 22) {
      const message = 'Unable to set localStorage key. Quota exceeded! Full disk?';
      console.warn(message);
    }
    console.log(err);
  });
}
localForageTest();
var _default = _localforage.default;
exports.default = _default;