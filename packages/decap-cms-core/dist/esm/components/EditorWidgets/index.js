"use strict";

var _registry = require("../../lib/registry");
var _UnknownControl = _interopRequireDefault(require("./Unknown/UnknownControl"));
var _UnknownPreview = _interopRequireDefault(require("./Unknown/UnknownPreview"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
(0, _registry.registerWidget)('unknown', _UnknownControl.default, _UnknownPreview.default);