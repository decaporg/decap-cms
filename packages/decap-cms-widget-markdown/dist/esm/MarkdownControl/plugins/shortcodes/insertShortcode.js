"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slate = require("slate");
var _isCursorInEmptyParagraph = _interopRequireDefault(require("./locations/isCursorInEmptyParagraph"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function insertShortcode(editor, pluginConfig) {
  const defaultValues = pluginConfig.fields.toMap().mapKeys((_, field) => field.get('name')).filter(field => field.has('default')).map(field => field.get('default'));

  // console.log(defaultValues);

  const nodeData = {
    type: 'shortcode',
    id: pluginConfig.id,
    data: {
      shortcode: pluginConfig.id,
      shortcodeNew: true,
      shortcodeData: defaultValues.toJS()
    },
    children: [{
      text: ''
    }]
  };
  if ((0, _isCursorInEmptyParagraph.default)(editor)) {
    _slate.Transforms.setNodes(editor, nodeData);
    return;
  }
  _slate.Transforms.insertNodes(editor, nodeData);
  console.log('handleInsertShortcode', pluginConfig);
}
var _default = insertShortcode;
exports.default = _default;