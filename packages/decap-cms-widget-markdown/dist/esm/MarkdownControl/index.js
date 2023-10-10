"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.getEditorComponents = getEditorComponents;
exports.getEditorControl = getEditorControl;
var _react = _interopRequireDefault(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _reactImmutableProptypes = _interopRequireDefault(require("react-immutable-proptypes"));
var _immutable = require("immutable");
var _RawEditor = _interopRequireDefault(require("./RawEditor"));
var _VisualEditor = _interopRequireDefault(require("./VisualEditor"));
var _core = require("@emotion/core");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
const MODE_STORAGE_KEY = 'cms.md-mode';

// TODO: passing the editorControl and components like this is horrible, should
// be handled through Redux and a separate registry store for instances
let editorControl;
// eslint-disable-next-line func-style
let _getEditorComponents = () => (0, _immutable.Map)();
function getEditorControl() {
  return editorControl;
}
function getEditorComponents() {
  return _getEditorComponents();
}
class MarkdownControl extends _react.default.Component {
  constructor(props) {
    var _localStorage$getItem;
    super(props);
    _defineProperty(this, "handleMode", mode => {
      this.setState({
        mode,
        pendingFocus: true
      });
      localStorage.setItem(MODE_STORAGE_KEY, mode);
    });
    _defineProperty(this, "processRef", ref => this.ref = ref);
    _defineProperty(this, "setFocusReceived", () => {
      this.setState({
        pendingFocus: false
      });
    });
    _defineProperty(this, "getAllowedModes", () => this.props.field.get('modes', (0, _immutable.List)(['rich_text', 'raw'])).toArray());
    editorControl = props.editorControl;
    const preferredMode = (_localStorage$getItem = localStorage.getItem(MODE_STORAGE_KEY)) !== null && _localStorage$getItem !== void 0 ? _localStorage$getItem : 'rich_text';
    _getEditorComponents = props.getEditorComponents;
    this.state = {
      mode: this.getAllowedModes().indexOf(preferredMode) !== -1 ? preferredMode : this.getAllowedModes()[0],
      pendingFocus: false
    };
  }
  render() {
    const {
      onChange,
      onAddAsset,
      getAsset,
      value,
      classNameWrapper,
      field,
      getEditorComponents,
      getRemarkPlugins,
      resolveWidget,
      t,
      isDisabled
    } = this.props;
    const {
      mode,
      pendingFocus
    } = this.state;
    const isShowModeToggle = this.getAllowedModes().length > 1;
    const visualEditor = (0, _core.jsx)("div", {
      className: "cms-editor-visual",
      ref: this.processRef
    }, (0, _core.jsx)(_VisualEditor.default, {
      onChange: onChange,
      onAddAsset: onAddAsset,
      isShowModeToggle: isShowModeToggle,
      onMode: this.handleMode,
      getAsset: getAsset,
      className: classNameWrapper,
      value: value,
      field: field,
      getEditorComponents: getEditorComponents,
      getRemarkPlugins: getRemarkPlugins,
      resolveWidget: resolveWidget,
      pendingFocus: pendingFocus && this.setFocusReceived,
      t: t,
      isDisabled: isDisabled
    }));
    const rawEditor = (0, _core.jsx)("div", {
      className: "cms-editor-raw",
      ref: this.processRef
    }, (0, _core.jsx)(_RawEditor.default, {
      onChange: onChange,
      onAddAsset: onAddAsset,
      isShowModeToggle: isShowModeToggle,
      onMode: this.handleMode,
      getAsset: getAsset,
      className: classNameWrapper,
      value: value,
      field: field,
      pendingFocus: pendingFocus && this.setFocusReceived,
      t: t
    }));
    return mode === 'rich_text' ? visualEditor : rawEditor;
  }
}
exports.default = MarkdownControl;
_defineProperty(MarkdownControl, "propTypes", {
  onChange: _propTypes.default.func.isRequired,
  onAddAsset: _propTypes.default.func.isRequired,
  getAsset: _propTypes.default.func.isRequired,
  classNameWrapper: _propTypes.default.string.isRequired,
  editorControl: _propTypes.default.elementType.isRequired,
  value: _propTypes.default.string,
  field: _reactImmutableProptypes.default.map.isRequired,
  getEditorComponents: _propTypes.default.func,
  t: _propTypes.default.func.isRequired
});
_defineProperty(MarkdownControl, "defaultProps", {
  value: ''
});