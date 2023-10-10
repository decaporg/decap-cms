"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
function matchLink() {
  return {
    match: n => !_slate.Editor.isEditor(n) && _slate.Element.isElement(n) && n.type === 'link'
  };
}
var _default = matchLink;
exports.default = _default;