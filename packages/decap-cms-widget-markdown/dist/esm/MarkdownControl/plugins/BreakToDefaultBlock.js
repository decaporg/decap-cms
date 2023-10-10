"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _isHotkey = _interopRequireDefault(require("is-hotkey"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function BreakToDefaultBlock({
  defaultType
}) {
  return {
    onKeyDown(event, editor, next) {
      const {
        selection,
        startBlock
      } = editor.value;
      const isEnter = (0, _isHotkey.default)('enter', event);
      if (!isEnter) {
        return next();
      }
      if (selection.isExpanded) {
        editor.delete();
        return next();
      }
      if (selection.start.isAtEndOfNode(startBlock) && startBlock.type !== defaultType) {
        return editor.insertBlock(defaultType);
      }
      return next();
    }
  };
}
var _default = BreakToDefaultBlock;
exports.default = _default;