"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _styledBase = _interopRequireDefault(require("@emotion/styled-base"));
var _react = _interopRequireWildcard(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _reactImmutableProptypes = _interopRequireDefault(require("react-immutable-proptypes"));
var _core = require("@emotion/core");
var _decapCmsUiDefault = require("decap-cms-ui-default");
var _slate = require("slate");
var _slateReact = require("slate-react");
var _slateHistory = require("slate-history");
var _styles = require("../styles");
var _Toolbar = _interopRequireDefault(require("./Toolbar"));
var _defaultEmptyBlock = _interopRequireDefault(require("./plugins/blocks/defaultEmptyBlock"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _EMOTION_STRINGIFIED_CSS_ERROR__() { return "You have tried to stringify object returned from `css` function. It isn't supposed to be used directly (e.g. as value of the `className` prop), but rather handed to emotion so it can handle it (e.g. as value of `css` prop)."; }
function rawEditorStyles({
  minimal
}) {
  return `
  position: relative;
  overflow: hidden;
  overflow-x: auto;
  min-height: ${minimal ? 'auto' : _decapCmsUiDefault.lengths.richTextEditorMinHeight};
  font-family: ${_decapCmsUiDefault.fonts.mono};
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  border-top: 0;
  margin-top: -${_styles.editorStyleVars.stickyDistanceBottom};
`;
}
const RawEditorContainer = (0, _styledBase.default)("div", {
  target: "e12tj7710",
  label: "RawEditorContainer"
})(process.env.NODE_ENV === "production" ? {
  name: "79elbk",
  styles: "position:relative;"
} : {
  name: "79elbk",
  styles: "position:relative;",
  map: "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9NYXJrZG93bkNvbnRyb2wvUmF3RWRpdG9yLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQTRCcUMiLCJmaWxlIjoiLi4vLi4vLi4vc3JjL01hcmtkb3duQ29udHJvbC9SYXdFZGl0b3IuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHsgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgSW1tdXRhYmxlUHJvcFR5cGVzIGZyb20gJ3JlYWN0LWltbXV0YWJsZS1wcm9wdHlwZXMnO1xuaW1wb3J0IHsgQ2xhc3NOYW1lcyB9IGZyb20gJ0BlbW90aW9uL2NvcmUnO1xuaW1wb3J0IHN0eWxlZCBmcm9tICdAZW1vdGlvbi9zdHlsZWQnO1xuaW1wb3J0IHsgbGVuZ3RocywgZm9udHMgfSBmcm9tICdkZWNhcC1jbXMtdWktZGVmYXVsdCc7XG5pbXBvcnQgeyBjcmVhdGVFZGl0b3IgfSBmcm9tICdzbGF0ZSc7XG5pbXBvcnQgeyBFZGl0YWJsZSwgUmVhY3RFZGl0b3IsIFNsYXRlLCB3aXRoUmVhY3QgfSBmcm9tICdzbGF0ZS1yZWFjdCc7XG5pbXBvcnQgeyB3aXRoSGlzdG9yeSB9IGZyb20gJ3NsYXRlLWhpc3RvcnknO1xuXG5pbXBvcnQgeyBlZGl0b3JTdHlsZVZhcnMsIEVkaXRvckNvbnRyb2xCYXIgfSBmcm9tICcuLi9zdHlsZXMnO1xuaW1wb3J0IFRvb2xiYXIgZnJvbSAnLi9Ub29sYmFyJztcbmltcG9ydCBkZWZhdWx0RW1wdHlCbG9jayBmcm9tICcuL3BsdWdpbnMvYmxvY2tzL2RlZmF1bHRFbXB0eUJsb2NrJztcblxuZnVuY3Rpb24gcmF3RWRpdG9yU3R5bGVzKHsgbWluaW1hbCB9KSB7XG4gIHJldHVybiBgXG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgb3ZlcmZsb3cteDogYXV0bztcbiAgbWluLWhlaWdodDogJHttaW5pbWFsID8gJ2F1dG8nIDogbGVuZ3Rocy5yaWNoVGV4dEVkaXRvck1pbkhlaWdodH07XG4gIGZvbnQtZmFtaWx5OiAke2ZvbnRzLm1vbm99O1xuICBib3JkZXItdG9wLWxlZnQtcmFkaXVzOiAwO1xuICBib3JkZXItdG9wLXJpZ2h0LXJhZGl1czogMDtcbiAgYm9yZGVyLXRvcDogMDtcbiAgbWFyZ2luLXRvcDogLSR7ZWRpdG9yU3R5bGVWYXJzLnN0aWNreURpc3RhbmNlQm90dG9tfTtcbmA7XG59XG5cbmNvbnN0IFJhd0VkaXRvckNvbnRhaW5lciA9IHN0eWxlZC5kaXZgXG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbmA7XG5mdW5jdGlvbiBSYXdFZGl0b3IocHJvcHMpIHtcbiAgY29uc3QgeyBjbGFzc05hbWUsIGZpZWxkLCBpc1Nob3dNb2RlVG9nZ2xlLCB0LCBvbkNoYW5nZSB9ID0gcHJvcHM7XG5cbiAgY29uc3QgZWRpdG9yID0gdXNlTWVtbygoKSA9PiB3aXRoUmVhY3Qod2l0aEhpc3RvcnkoY3JlYXRlRWRpdG9yKCkpKSwgW10pO1xuXG4gIGNvbnN0IFt2YWx1ZSwgc2V0VmFsdWVdID0gdXNlU3RhdGUoXG4gICAgcHJvcHMudmFsdWVcbiAgICAgID8gcHJvcHMudmFsdWUuc3BsaXQoJ1xcbicpLm1hcChsaW5lID0+IGRlZmF1bHRFbXB0eUJsb2NrKGxpbmUpKVxuICAgICAgOiBbZGVmYXVsdEVtcHR5QmxvY2soKV0sXG4gICk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAocHJvcHMucGVuZGluZ0ZvY3VzKSB7XG4gICAgICBSZWFjdEVkaXRvci5mb2N1cyhlZGl0b3IpO1xuICAgIH1cbiAgfSwgW10pO1xuXG4gIGZ1bmN0aW9uIGhhbmRsZVRvZ2dsZU1vZGUoKSB7XG4gICAgcHJvcHMub25Nb2RlKCdyaWNoX3RleHQnKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhhbmRsZUNoYW5nZSh2YWx1ZSkge1xuICAgIG9uQ2hhbmdlKHZhbHVlLm1hcChsaW5lID0+IGxpbmUuY2hpbGRyZW5bMF0udGV4dCkuam9pbignXFxuJykpO1xuICAgIHNldFZhbHVlKHZhbHVlKTtcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPFNsYXRlIGVkaXRvcj17ZWRpdG9yfSB2YWx1ZT17dmFsdWV9IG9uQ2hhbmdlPXtoYW5kbGVDaGFuZ2V9PlxuICAgICAgPFJhd0VkaXRvckNvbnRhaW5lcj5cbiAgICAgICAgPEVkaXRvckNvbnRyb2xCYXI+XG4gICAgICAgICAgPFRvb2xiYXJcbiAgICAgICAgICAgIG9uVG9nZ2xlTW9kZT17aGFuZGxlVG9nZ2xlTW9kZX1cbiAgICAgICAgICAgIGJ1dHRvbnM9e2ZpZWxkLmdldCgnYnV0dG9ucycpfVxuICAgICAgICAgICAgZGlzYWJsZWRcbiAgICAgICAgICAgIHJhd01vZGVcbiAgICAgICAgICAgIGlzU2hvd01vZGVUb2dnbGU9e2lzU2hvd01vZGVUb2dnbGV9XG4gICAgICAgICAgICB0PXt0fVxuICAgICAgICAgIC8+XG4gICAgICAgIDwvRWRpdG9yQ29udHJvbEJhcj5cbiAgICAgICAgPENsYXNzTmFtZXM+XG4gICAgICAgICAgeyh7IGNzcywgY3ggfSkgPT4gKFxuICAgICAgICAgICAgPEVkaXRhYmxlXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT17Y3goXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lLFxuICAgICAgICAgICAgICAgIGNzc2BcbiAgICAgICAgICAgICAgICAgICR7cmF3RWRpdG9yU3R5bGVzKHsgbWluaW1hbDogZmllbGQuZ2V0KCdtaW5pbWFsJykgfSl9XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgdmFsdWU9e3ZhbHVlfVxuICAgICAgICAgICAgICBvbkNoYW5nZT17aGFuZGxlQ2hhbmdlfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICApfVxuICAgICAgICA8L0NsYXNzTmFtZXM+XG4gICAgICA8L1Jhd0VkaXRvckNvbnRhaW5lcj5cbiAgICA8L1NsYXRlPlxuICApO1xufVxuXG5SYXdFZGl0b3IucHJvcFR5cGVzID0ge1xuICBvbkNoYW5nZTogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgb25Nb2RlOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICBjbGFzc05hbWU6IFByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcbiAgdmFsdWU6IFByb3BUeXBlcy5zdHJpbmcsXG4gIGZpZWxkOiBJbW11dGFibGVQcm9wVHlwZXMubWFwLmlzUmVxdWlyZWQsXG4gIGlzU2hvd01vZGVUb2dnbGU6IFByb3BUeXBlcy5ib29sLmlzUmVxdWlyZWQsXG4gIHQ6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG59O1xuXG5leHBvcnQgZGVmYXVsdCBSYXdFZGl0b3I7XG4iXX0= */",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__
});
function RawEditor(props) {
  const {
    className,
    field,
    isShowModeToggle,
    t,
    onChange
  } = props;
  const editor = (0, _react.useMemo)(() => (0, _slateReact.withReact)((0, _slateHistory.withHistory)((0, _slate.createEditor)())), []);
  const [value, setValue] = (0, _react.useState)(props.value ? props.value.split('\n').map(line => (0, _defaultEmptyBlock.default)(line)) : [(0, _defaultEmptyBlock.default)()]);
  (0, _react.useEffect)(() => {
    if (props.pendingFocus) {
      _slateReact.ReactEditor.focus(editor);
    }
  }, []);
  function handleToggleMode() {
    props.onMode('rich_text');
  }
  function handleChange(value) {
    onChange(value.map(line => line.children[0].text).join('\n'));
    setValue(value);
  }
  return (0, _core.jsx)(_slateReact.Slate, {
    editor: editor,
    value: value,
    onChange: handleChange
  }, (0, _core.jsx)(RawEditorContainer, null, (0, _core.jsx)(_styles.EditorControlBar, null, (0, _core.jsx)(_Toolbar.default, {
    onToggleMode: handleToggleMode,
    buttons: field.get('buttons'),
    disabled: true,
    rawMode: true,
    isShowModeToggle: isShowModeToggle,
    t: t
  })), (0, _core.jsx)(_core.ClassNames, null, ({
    css,
    cx
  }) => (0, _core.jsx)(_slateReact.Editable, {
    className: cx(className, css`
                  ${rawEditorStyles({
      minimal: field.get('minimal')
    })}
                `),
    value: value,
    onChange: handleChange
  }))));
}
RawEditor.propTypes = {
  onChange: _propTypes.default.func.isRequired,
  onMode: _propTypes.default.func.isRequired,
  className: _propTypes.default.string.isRequired,
  value: _propTypes.default.string,
  field: _reactImmutableProptypes.default.map.isRequired,
  isShowModeToggle: _propTypes.default.bool.isRequired,
  t: _propTypes.default.func.isRequired
};
var _default = RawEditor;
exports.default = _default;