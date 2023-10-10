"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getPhrases = getPhrases;
var _merge2 = _interopRequireDefault(require("lodash/merge"));
var _registry = require("./registry");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function getPhrases(locale) {
  const phrases = (0, _merge2.default)({}, (0, _registry.getLocale)('en'), (0, _registry.getLocale)(locale));
  return phrases;
}