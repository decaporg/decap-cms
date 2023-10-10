"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _jsSha = require("js-sha256");
var _default = blob => new Promise((resolve, reject) => {
  const fr = new FileReader();
  fr.onload = ({
    target
  }) => resolve((0, _jsSha.sha256)((target === null || target === void 0 ? void 0 : target.result) || ''));
  fr.onerror = err => {
    fr.abort();
    reject(err);
  };
  fr.readAsArrayBuffer(blob);
});
exports.default = _default;