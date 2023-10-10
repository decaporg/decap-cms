"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireDefault(require("react"));
var _core = require("@emotion/core");
var _decapCmsUiDefault = require("decap-cms-ui-default");
var _slateReact = require("slate-react");
var _slate = require("slate");
var _defaultEmptyBlock = _interopRequireDefault(require("../plugins/blocks/defaultEmptyBlock"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); } /* eslint-disable react/prop-types */
function InsertionPoint(props) {
  return (0, _core.jsx)("div", _extends({
    css: /*#__PURE__*/(0, _core.css)("height:32px;cursor:text;position:relative;z-index:", _decapCmsUiDefault.zIndex.zIndex1, ";margin-top:-16px;;label:InsertionPoint;" + (process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9NYXJrZG93bkNvbnRyb2wvY29tcG9uZW50cy9Wb2lkQmxvY2suanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBWWMiLCJmaWxlIjoiLi4vLi4vLi4vLi4vc3JjL01hcmtkb3duQ29udHJvbC9jb21wb25lbnRzL1ZvaWRCbG9jay5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIHJlYWN0L3Byb3AtdHlwZXMgKi9cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBjc3MgfSBmcm9tICdAZW1vdGlvbi9jb3JlJztcbmltcG9ydCB7IHpJbmRleCB9IGZyb20gJ2RlY2FwLWNtcy11aS1kZWZhdWx0JztcbmltcG9ydCB7IFJlYWN0RWRpdG9yLCB1c2VTbGF0ZSB9IGZyb20gJ3NsYXRlLXJlYWN0JztcbmltcG9ydCB7IFRyYW5zZm9ybXMgfSBmcm9tICdzbGF0ZSc7XG5cbmltcG9ydCBkZWZhdWx0RW1wdHlCbG9jayBmcm9tICcuLi9wbHVnaW5zL2Jsb2Nrcy9kZWZhdWx0RW1wdHlCbG9jayc7XG5cbmZ1bmN0aW9uIEluc2VydGlvblBvaW50KHByb3BzKSB7XG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgY3NzPXtjc3NgXG4gICAgICAgIGhlaWdodDogMzJweDtcbiAgICAgICAgY3Vyc29yOiB0ZXh0O1xuICAgICAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgICAgIHotaW5kZXg6ICR7ekluZGV4LnpJbmRleDF9O1xuICAgICAgICBtYXJnaW4tdG9wOiAtMTZweDtcbiAgICAgIGB9XG4gICAgICB7Li4ucHJvcHN9XG4gICAgLz5cbiAgKTtcbn1cblxuZnVuY3Rpb24gVm9pZEJsb2NrKHsgYXR0cmlidXRlcywgY2hpbGRyZW4sIGVsZW1lbnQgfSkge1xuICBjb25zdCBlZGl0b3IgPSB1c2VTbGF0ZSgpO1xuICBjb25zdCBwYXRoID0gUmVhY3RFZGl0b3IuZmluZFBhdGgoZWRpdG9yLCBlbGVtZW50KTtcblxuICBmdW5jdGlvbiBpbnNlcnRBdFBhdGgoYXQpIHtcbiAgICBUcmFuc2Zvcm1zLmluc2VydE5vZGVzKGVkaXRvciwgZGVmYXVsdEVtcHR5QmxvY2soKSwgeyBzZWxlY3Q6IHRydWUsIGF0IH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gaGFuZGxlQ2xpY2soZXZlbnQpIHtcbiAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhhbmRsZUluc2VydEJlZm9yZSgpIHtcbiAgICBpbnNlcnRBdFBhdGgocGF0aCk7XG4gIH1cblxuICBmdW5jdGlvbiBoYW5kbGVJbnNlcnRBZnRlcigpIHtcbiAgICBpbnNlcnRBdFBhdGgoWy4uLnBhdGguc2xpY2UoMCwgLTEpLCBwYXRoW3BhdGgubGVuZ3RoIC0gMV0gKyAxXSk7XG4gIH1cblxuICBjb25zdCBpbnNlcnRCZWZvcmUgPSBwYXRoWzBdID09PSAwO1xuICBjb25zdCBuZXh0RWxlbWVudCA9IGVkaXRvci5jaGlsZHJlbltwYXRoWzBdICsgMV07XG4gIGNvbnN0IGluc2VydEFmdGVyID0gcGF0aFswXSA9PT0gZWRpdG9yLmNoaWxkcmVuLmxlbmd0aCAtIDEgfHwgZWRpdG9yLmlzVm9pZChuZXh0RWxlbWVudCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IHsuLi5hdHRyaWJ1dGVzfSBvbkNsaWNrPXtoYW5kbGVDbGlja30gY29udGVudEVkaXRhYmxlPXtmYWxzZX0+XG4gICAgICB7aW5zZXJ0QmVmb3JlICYmIDxJbnNlcnRpb25Qb2ludCBvbkNsaWNrPXtoYW5kbGVJbnNlcnRCZWZvcmV9IC8+fVxuICAgICAge2NoaWxkcmVufVxuICAgICAge2luc2VydEFmdGVyICYmIDxJbnNlcnRpb25Qb2ludCBvbkNsaWNrPXtoYW5kbGVJbnNlcnRBZnRlcn0gLz59XG4gICAgPC9kaXY+XG4gICk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IFZvaWRCbG9jaztcbiJdfQ== */"))
  }, props));
}
function VoidBlock({
  attributes,
  children,
  element
}) {
  const editor = (0, _slateReact.useSlate)();
  const path = _slateReact.ReactEditor.findPath(editor, element);
  function insertAtPath(at) {
    _slate.Transforms.insertNodes(editor, (0, _defaultEmptyBlock.default)(), {
      select: true,
      at
    });
  }
  function handleClick(event) {
    event.stopPropagation();
  }
  function handleInsertBefore() {
    insertAtPath(path);
  }
  function handleInsertAfter() {
    insertAtPath([...path.slice(0, -1), path[path.length - 1] + 1]);
  }
  const insertBefore = path[0] === 0;
  const nextElement = editor.children[path[0] + 1];
  const insertAfter = path[0] === editor.children.length - 1 || editor.isVoid(nextElement);
  return (0, _core.jsx)("div", _extends({}, attributes, {
    onClick: handleClick,
    contentEditable: false
  }), insertBefore && (0, _core.jsx)(InsertionPoint, {
    onClick: handleInsertBefore
  }), children, insertAfter && (0, _core.jsx)(InsertionPoint, {
    onClick: handleInsertAfter
  }));
}
var _default = VoidBlock;
exports.default = _default;