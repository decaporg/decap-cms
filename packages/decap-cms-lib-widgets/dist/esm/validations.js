"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validateMinMax = validateMinMax;
var _isNumber2 = _interopRequireDefault(require("lodash/isNumber"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function validateMinMax(t, fieldLabel, value, min, max) {
  function minMaxError(messageKey) {
    return {
      type: 'RANGE',
      message: t(`editor.editorControlPane.widget.${messageKey}`, {
        fieldLabel,
        minCount: min,
        maxCount: max,
        count: min
      })
    };
  }
  if ([min, max, value === null || value === void 0 ? void 0 : value.size].every(_isNumber2.default) && (value.size < min || value.size > max)) {
    return minMaxError(min === max ? 'rangeCountExact' : 'rangeCount');
  } else if ((0, _isNumber2.default)(min) && min > 0 && value !== null && value !== void 0 && value.size && value.size < min) {
    return minMaxError('rangeMin');
  } else if ((0, _isNumber2.default)(max) && value !== null && value !== void 0 && value.size && value.size > max) {
    return minMaxError('rangeMax');
  }
}