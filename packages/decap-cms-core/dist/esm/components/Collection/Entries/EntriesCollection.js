"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.EntriesCollection = void 0;
exports.filterNestedEntries = filterNestedEntries;
var _styledBase = _interopRequireDefault(require("@emotion/styled-base"));
var _partial2 = _interopRequireDefault(require("lodash/partial"));
var _react = _interopRequireDefault(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _reactImmutableProptypes = _interopRequireDefault(require("react-immutable-proptypes"));
var _reactRedux = require("react-redux");
var _reactPolyglot = require("react-polyglot");
var _decapCmsLibUtil = require("decap-cms-lib-util");
var _decapCmsUiDefault = require("decap-cms-ui-default");
var _entries = require("../../../actions/entries");
var _entries2 = require("../../../reducers/entries");
var _cursors = require("../../../reducers/cursors");
var _Entries = _interopRequireDefault(require("./Entries"));
var _core = require("@emotion/core");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
const GroupHeading = (0, _styledBase.default)("h2", {
  target: "eucqz2q0",
  label: "GroupHeading"
})("font-size:23px;font-weight:600;color:", _decapCmsUiDefault.colors.textLead, ";" + (process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL0NvbGxlY3Rpb24vRW50cmllcy9FbnRyaWVzQ29sbGVjdGlvbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUF1QjhCIiwiZmlsZSI6Ii4uLy4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL0NvbGxlY3Rpb24vRW50cmllcy9FbnRyaWVzQ29sbGVjdGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IEltbXV0YWJsZVByb3BUeXBlcyBmcm9tICdyZWFjdC1pbW11dGFibGUtcHJvcHR5cGVzJztcbmltcG9ydCB7IGNvbm5lY3QgfSBmcm9tICdyZWFjdC1yZWR1eCc7XG5pbXBvcnQgc3R5bGVkIGZyb20gJ0BlbW90aW9uL3N0eWxlZCc7XG5pbXBvcnQgeyB0cmFuc2xhdGUgfSBmcm9tICdyZWFjdC1wb2x5Z2xvdCc7XG5pbXBvcnQgeyBwYXJ0aWFsIH0gZnJvbSAnbG9kYXNoJztcbmltcG9ydCB7IEN1cnNvciB9IGZyb20gJ2RlY2FwLWNtcy1saWItdXRpbCc7XG5pbXBvcnQgeyBjb2xvcnMgfSBmcm9tICdkZWNhcC1jbXMtdWktZGVmYXVsdCc7XG5cbmltcG9ydCB7XG4gIGxvYWRFbnRyaWVzIGFzIGFjdGlvbkxvYWRFbnRyaWVzLFxuICB0cmF2ZXJzZUNvbGxlY3Rpb25DdXJzb3IgYXMgYWN0aW9uVHJhdmVyc2VDb2xsZWN0aW9uQ3Vyc29yLFxufSBmcm9tICcuLi8uLi8uLi9hY3Rpb25zL2VudHJpZXMnO1xuaW1wb3J0IHtcbiAgc2VsZWN0RW50cmllcyxcbiAgc2VsZWN0RW50cmllc0xvYWRlZCxcbiAgc2VsZWN0SXNGZXRjaGluZyxcbiAgc2VsZWN0R3JvdXBzLFxufSBmcm9tICcuLi8uLi8uLi9yZWR1Y2Vycy9lbnRyaWVzJztcbmltcG9ydCB7IHNlbGVjdENvbGxlY3Rpb25FbnRyaWVzQ3Vyc29yIH0gZnJvbSAnLi4vLi4vLi4vcmVkdWNlcnMvY3Vyc29ycyc7XG5pbXBvcnQgRW50cmllcyBmcm9tICcuL0VudHJpZXMnO1xuXG5jb25zdCBHcm91cEhlYWRpbmcgPSBzdHlsZWQuaDJgXG4gIGZvbnQtc2l6ZTogMjNweDtcbiAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgY29sb3I6ICR7Y29sb3JzLnRleHRMZWFkfTtcbmA7XG5cbmNvbnN0IEdyb3VwQ29udGFpbmVyID0gc3R5bGVkLmRpdmBgO1xuXG5mdW5jdGlvbiBnZXRHcm91cEVudHJpZXMoZW50cmllcywgcGF0aHMpIHtcbiAgcmV0dXJuIGVudHJpZXMuZmlsdGVyKGVudHJ5ID0+IHBhdGhzLmhhcyhlbnRyeS5nZXQoJ3BhdGgnKSkpO1xufVxuXG5mdW5jdGlvbiBnZXRHcm91cFRpdGxlKGdyb3VwLCB0KSB7XG4gIGNvbnN0IHsgbGFiZWwsIHZhbHVlIH0gPSBncm91cDtcbiAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gdCgnY29sbGVjdGlvbi5ncm91cHMub3RoZXInKTtcbiAgfVxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnYm9vbGVhbicpIHtcbiAgICByZXR1cm4gdmFsdWUgPyBsYWJlbCA6IHQoJ2NvbGxlY3Rpb24uZ3JvdXBzLm5lZ2F0ZUxhYmVsJywgeyBsYWJlbCB9KTtcbiAgfVxuICByZXR1cm4gYCR7bGFiZWx9ICR7dmFsdWV9YC50cmltKCk7XG59XG5cbmZ1bmN0aW9uIHdpdGhHcm91cHMoZ3JvdXBzLCBlbnRyaWVzLCBFbnRyaWVzVG9SZW5kZXIsIHQpIHtcbiAgcmV0dXJuIGdyb3Vwcy5tYXAoZ3JvdXAgPT4ge1xuICAgIGNvbnN0IHRpdGxlID0gZ2V0R3JvdXBUaXRsZShncm91cCwgdCk7XG4gICAgcmV0dXJuIChcbiAgICAgIDxHcm91cENvbnRhaW5lciBrZXk9e2dyb3VwLmlkfSBpZD17Z3JvdXAuaWR9PlxuICAgICAgICA8R3JvdXBIZWFkaW5nPnt0aXRsZX08L0dyb3VwSGVhZGluZz5cbiAgICAgICAgPEVudHJpZXNUb1JlbmRlciBlbnRyaWVzPXtnZXRHcm91cEVudHJpZXMoZW50cmllcywgZ3JvdXAucGF0aHMpfSAvPlxuICAgICAgPC9Hcm91cENvbnRhaW5lcj5cbiAgICApO1xuICB9KTtcbn1cblxuZXhwb3J0IGNsYXNzIEVudHJpZXNDb2xsZWN0aW9uIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICBjb2xsZWN0aW9uOiBJbW11dGFibGVQcm9wVHlwZXMubWFwLmlzUmVxdWlyZWQsXG4gICAgcGFnZTogUHJvcFR5cGVzLm51bWJlcixcbiAgICBlbnRyaWVzOiBJbW11dGFibGVQcm9wVHlwZXMubGlzdCxcbiAgICBncm91cHM6IFByb3BUeXBlcy5hcnJheSxcbiAgICBpc0ZldGNoaW5nOiBQcm9wVHlwZXMuYm9vbC5pc1JlcXVpcmVkLFxuICAgIHZpZXdTdHlsZTogUHJvcFR5cGVzLnN0cmluZyxcbiAgICBjdXJzb3I6IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcbiAgICBsb2FkRW50cmllczogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICB0cmF2ZXJzZUNvbGxlY3Rpb25DdXJzb3I6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgZW50cmllc0xvYWRlZDogUHJvcFR5cGVzLmJvb2wsXG4gIH07XG5cbiAgY29tcG9uZW50RGlkTW91bnQoKSB7XG4gICAgY29uc3QgeyBjb2xsZWN0aW9uLCBlbnRyaWVzTG9hZGVkLCBsb2FkRW50cmllcyB9ID0gdGhpcy5wcm9wcztcbiAgICBpZiAoY29sbGVjdGlvbiAmJiAhZW50cmllc0xvYWRlZCkge1xuICAgICAgbG9hZEVudHJpZXMoY29sbGVjdGlvbik7XG4gICAgfVxuICB9XG5cbiAgY29tcG9uZW50RGlkVXBkYXRlKHByZXZQcm9wcykge1xuICAgIGNvbnN0IHsgY29sbGVjdGlvbiwgZW50cmllc0xvYWRlZCwgbG9hZEVudHJpZXMgfSA9IHRoaXMucHJvcHM7XG4gICAgaWYgKGNvbGxlY3Rpb24gIT09IHByZXZQcm9wcy5jb2xsZWN0aW9uICYmICFlbnRyaWVzTG9hZGVkKSB7XG4gICAgICBsb2FkRW50cmllcyhjb2xsZWN0aW9uKTtcbiAgICB9XG4gIH1cblxuICBoYW5kbGVDdXJzb3JBY3Rpb25zID0gKGN1cnNvciwgYWN0aW9uKSA9PiB7XG4gICAgY29uc3QgeyBjb2xsZWN0aW9uLCB0cmF2ZXJzZUNvbGxlY3Rpb25DdXJzb3IgfSA9IHRoaXMucHJvcHM7XG4gICAgdHJhdmVyc2VDb2xsZWN0aW9uQ3Vyc29yKGNvbGxlY3Rpb24sIGFjdGlvbik7XG4gIH07XG5cbiAgcmVuZGVyKCkge1xuICAgIGNvbnN0IHsgY29sbGVjdGlvbiwgZW50cmllcywgZ3JvdXBzLCBpc0ZldGNoaW5nLCB2aWV3U3R5bGUsIGN1cnNvciwgcGFnZSwgdCB9ID0gdGhpcy5wcm9wcztcblxuICAgIGNvbnN0IEVudHJpZXNUb1JlbmRlciA9ICh7IGVudHJpZXMgfSkgPT4ge1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgPEVudHJpZXNcbiAgICAgICAgICBjb2xsZWN0aW9ucz17Y29sbGVjdGlvbn1cbiAgICAgICAgICBlbnRyaWVzPXtlbnRyaWVzfVxuICAgICAgICAgIGlzRmV0Y2hpbmc9e2lzRmV0Y2hpbmd9XG4gICAgICAgICAgY29sbGVjdGlvbk5hbWU9e2NvbGxlY3Rpb24uZ2V0KCdsYWJlbCcpfVxuICAgICAgICAgIHZpZXdTdHlsZT17dmlld1N0eWxlfVxuICAgICAgICAgIGN1cnNvcj17Y3Vyc29yfVxuICAgICAgICAgIGhhbmRsZUN1cnNvckFjdGlvbnM9e3BhcnRpYWwodGhpcy5oYW5kbGVDdXJzb3JBY3Rpb25zLCBjdXJzb3IpfVxuICAgICAgICAgIHBhZ2U9e3BhZ2V9XG4gICAgICAgIC8+XG4gICAgICApO1xuICAgIH07XG5cbiAgICBpZiAoZ3JvdXBzICYmIGdyb3Vwcy5sZW5ndGggPiAwKSB7XG4gICAgICByZXR1cm4gd2l0aEdyb3Vwcyhncm91cHMsIGVudHJpZXMsIEVudHJpZXNUb1JlbmRlciwgdCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIDxFbnRyaWVzVG9SZW5kZXIgZW50cmllcz17ZW50cmllc30gLz47XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbHRlck5lc3RlZEVudHJpZXMocGF0aCwgY29sbGVjdGlvbkZvbGRlciwgZW50cmllcykge1xuICBjb25zdCBmaWx0ZXJlZCA9IGVudHJpZXMuZmlsdGVyKGUgPT4ge1xuICAgIGNvbnN0IGVudHJ5UGF0aCA9IGUuZ2V0KCdwYXRoJykuc2xpY2UoY29sbGVjdGlvbkZvbGRlci5sZW5ndGggKyAxKTtcbiAgICBpZiAoIWVudHJ5UGF0aC5zdGFydHNXaXRoKHBhdGgpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gb25seSBzaG93IGltbWVkaWF0ZSBjaGlsZHJlblxuICAgIGlmIChwYXRoKSB7XG4gICAgICAvLyBub24gcm9vdCBwYXRoXG4gICAgICBjb25zdCB0cmltbWVkID0gZW50cnlQYXRoLnNsaWNlKHBhdGgubGVuZ3RoICsgMSk7XG4gICAgICByZXR1cm4gdHJpbW1lZC5zcGxpdCgnLycpLmxlbmd0aCA9PT0gMjtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gcm9vdCBwYXRoXG4gICAgICByZXR1cm4gZW50cnlQYXRoLnNwbGl0KCcvJykubGVuZ3RoIDw9IDI7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIGZpbHRlcmVkO1xufVxuXG5mdW5jdGlvbiBtYXBTdGF0ZVRvUHJvcHMoc3RhdGUsIG93blByb3BzKSB7XG4gIGNvbnN0IHsgY29sbGVjdGlvbiwgdmlld1N0eWxlLCBmaWx0ZXJUZXJtIH0gPSBvd25Qcm9wcztcbiAgY29uc3QgcGFnZSA9IHN0YXRlLmVudHJpZXMuZ2V0SW4oWydwYWdlcycsIGNvbGxlY3Rpb24uZ2V0KCduYW1lJyksICdwYWdlJ10pO1xuXG4gIGxldCBlbnRyaWVzID0gc2VsZWN0RW50cmllcyhzdGF0ZS5lbnRyaWVzLCBjb2xsZWN0aW9uKTtcbiAgY29uc3QgZ3JvdXBzID0gc2VsZWN0R3JvdXBzKHN0YXRlLmVudHJpZXMsIGNvbGxlY3Rpb24pO1xuXG4gIGlmIChjb2xsZWN0aW9uLmhhcygnbmVzdGVkJykpIHtcbiAgICBjb25zdCBjb2xsZWN0aW9uRm9sZGVyID0gY29sbGVjdGlvbi5nZXQoJ2ZvbGRlcicpO1xuICAgIGVudHJpZXMgPSBmaWx0ZXJOZXN0ZWRFbnRyaWVzKGZpbHRlclRlcm0gfHwgJycsIGNvbGxlY3Rpb25Gb2xkZXIsIGVudHJpZXMpO1xuICB9XG4gIGNvbnN0IGVudHJpZXNMb2FkZWQgPSBzZWxlY3RFbnRyaWVzTG9hZGVkKHN0YXRlLmVudHJpZXMsIGNvbGxlY3Rpb24uZ2V0KCduYW1lJykpO1xuICBjb25zdCBpc0ZldGNoaW5nID0gc2VsZWN0SXNGZXRjaGluZyhzdGF0ZS5lbnRyaWVzLCBjb2xsZWN0aW9uLmdldCgnbmFtZScpKTtcblxuICBjb25zdCByYXdDdXJzb3IgPSBzZWxlY3RDb2xsZWN0aW9uRW50cmllc0N1cnNvcihzdGF0ZS5jdXJzb3JzLCBjb2xsZWN0aW9uLmdldCgnbmFtZScpKTtcbiAgY29uc3QgY3Vyc29yID0gQ3Vyc29yLmNyZWF0ZShyYXdDdXJzb3IpLmNsZWFyRGF0YSgpO1xuXG4gIHJldHVybiB7IGNvbGxlY3Rpb24sIHBhZ2UsIGVudHJpZXMsIGdyb3VwcywgZW50cmllc0xvYWRlZCwgaXNGZXRjaGluZywgdmlld1N0eWxlLCBjdXJzb3IgfTtcbn1cblxuY29uc3QgbWFwRGlzcGF0Y2hUb1Byb3BzID0ge1xuICBsb2FkRW50cmllczogYWN0aW9uTG9hZEVudHJpZXMsXG4gIHRyYXZlcnNlQ29sbGVjdGlvbkN1cnNvcjogYWN0aW9uVHJhdmVyc2VDb2xsZWN0aW9uQ3Vyc29yLFxufTtcblxuY29uc3QgQ29ubmVjdGVkRW50cmllc0NvbGxlY3Rpb24gPSBjb25uZWN0KG1hcFN0YXRlVG9Qcm9wcywgbWFwRGlzcGF0Y2hUb1Byb3BzKShFbnRyaWVzQ29sbGVjdGlvbik7XG5cbmV4cG9ydCBkZWZhdWx0IHRyYW5zbGF0ZSgpKENvbm5lY3RlZEVudHJpZXNDb2xsZWN0aW9uKTtcbiJdfQ== */"));
const GroupContainer = (0, _styledBase.default)("div", {
  target: "eucqz2q1",
  label: "GroupContainer"
})(process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL0NvbGxlY3Rpb24vRW50cmllcy9FbnRyaWVzQ29sbGVjdGlvbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUE2QmlDIiwiZmlsZSI6Ii4uLy4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL0NvbGxlY3Rpb24vRW50cmllcy9FbnRyaWVzQ29sbGVjdGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IEltbXV0YWJsZVByb3BUeXBlcyBmcm9tICdyZWFjdC1pbW11dGFibGUtcHJvcHR5cGVzJztcbmltcG9ydCB7IGNvbm5lY3QgfSBmcm9tICdyZWFjdC1yZWR1eCc7XG5pbXBvcnQgc3R5bGVkIGZyb20gJ0BlbW90aW9uL3N0eWxlZCc7XG5pbXBvcnQgeyB0cmFuc2xhdGUgfSBmcm9tICdyZWFjdC1wb2x5Z2xvdCc7XG5pbXBvcnQgeyBwYXJ0aWFsIH0gZnJvbSAnbG9kYXNoJztcbmltcG9ydCB7IEN1cnNvciB9IGZyb20gJ2RlY2FwLWNtcy1saWItdXRpbCc7XG5pbXBvcnQgeyBjb2xvcnMgfSBmcm9tICdkZWNhcC1jbXMtdWktZGVmYXVsdCc7XG5cbmltcG9ydCB7XG4gIGxvYWRFbnRyaWVzIGFzIGFjdGlvbkxvYWRFbnRyaWVzLFxuICB0cmF2ZXJzZUNvbGxlY3Rpb25DdXJzb3IgYXMgYWN0aW9uVHJhdmVyc2VDb2xsZWN0aW9uQ3Vyc29yLFxufSBmcm9tICcuLi8uLi8uLi9hY3Rpb25zL2VudHJpZXMnO1xuaW1wb3J0IHtcbiAgc2VsZWN0RW50cmllcyxcbiAgc2VsZWN0RW50cmllc0xvYWRlZCxcbiAgc2VsZWN0SXNGZXRjaGluZyxcbiAgc2VsZWN0R3JvdXBzLFxufSBmcm9tICcuLi8uLi8uLi9yZWR1Y2Vycy9lbnRyaWVzJztcbmltcG9ydCB7IHNlbGVjdENvbGxlY3Rpb25FbnRyaWVzQ3Vyc29yIH0gZnJvbSAnLi4vLi4vLi4vcmVkdWNlcnMvY3Vyc29ycyc7XG5pbXBvcnQgRW50cmllcyBmcm9tICcuL0VudHJpZXMnO1xuXG5jb25zdCBHcm91cEhlYWRpbmcgPSBzdHlsZWQuaDJgXG4gIGZvbnQtc2l6ZTogMjNweDtcbiAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgY29sb3I6ICR7Y29sb3JzLnRleHRMZWFkfTtcbmA7XG5cbmNvbnN0IEdyb3VwQ29udGFpbmVyID0gc3R5bGVkLmRpdmBgO1xuXG5mdW5jdGlvbiBnZXRHcm91cEVudHJpZXMoZW50cmllcywgcGF0aHMpIHtcbiAgcmV0dXJuIGVudHJpZXMuZmlsdGVyKGVudHJ5ID0+IHBhdGhzLmhhcyhlbnRyeS5nZXQoJ3BhdGgnKSkpO1xufVxuXG5mdW5jdGlvbiBnZXRHcm91cFRpdGxlKGdyb3VwLCB0KSB7XG4gIGNvbnN0IHsgbGFiZWwsIHZhbHVlIH0gPSBncm91cDtcbiAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gdCgnY29sbGVjdGlvbi5ncm91cHMub3RoZXInKTtcbiAgfVxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnYm9vbGVhbicpIHtcbiAgICByZXR1cm4gdmFsdWUgPyBsYWJlbCA6IHQoJ2NvbGxlY3Rpb24uZ3JvdXBzLm5lZ2F0ZUxhYmVsJywgeyBsYWJlbCB9KTtcbiAgfVxuICByZXR1cm4gYCR7bGFiZWx9ICR7dmFsdWV9YC50cmltKCk7XG59XG5cbmZ1bmN0aW9uIHdpdGhHcm91cHMoZ3JvdXBzLCBlbnRyaWVzLCBFbnRyaWVzVG9SZW5kZXIsIHQpIHtcbiAgcmV0dXJuIGdyb3Vwcy5tYXAoZ3JvdXAgPT4ge1xuICAgIGNvbnN0IHRpdGxlID0gZ2V0R3JvdXBUaXRsZShncm91cCwgdCk7XG4gICAgcmV0dXJuIChcbiAgICAgIDxHcm91cENvbnRhaW5lciBrZXk9e2dyb3VwLmlkfSBpZD17Z3JvdXAuaWR9PlxuICAgICAgICA8R3JvdXBIZWFkaW5nPnt0aXRsZX08L0dyb3VwSGVhZGluZz5cbiAgICAgICAgPEVudHJpZXNUb1JlbmRlciBlbnRyaWVzPXtnZXRHcm91cEVudHJpZXMoZW50cmllcywgZ3JvdXAucGF0aHMpfSAvPlxuICAgICAgPC9Hcm91cENvbnRhaW5lcj5cbiAgICApO1xuICB9KTtcbn1cblxuZXhwb3J0IGNsYXNzIEVudHJpZXNDb2xsZWN0aW9uIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICBjb2xsZWN0aW9uOiBJbW11dGFibGVQcm9wVHlwZXMubWFwLmlzUmVxdWlyZWQsXG4gICAgcGFnZTogUHJvcFR5cGVzLm51bWJlcixcbiAgICBlbnRyaWVzOiBJbW11dGFibGVQcm9wVHlwZXMubGlzdCxcbiAgICBncm91cHM6IFByb3BUeXBlcy5hcnJheSxcbiAgICBpc0ZldGNoaW5nOiBQcm9wVHlwZXMuYm9vbC5pc1JlcXVpcmVkLFxuICAgIHZpZXdTdHlsZTogUHJvcFR5cGVzLnN0cmluZyxcbiAgICBjdXJzb3I6IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcbiAgICBsb2FkRW50cmllczogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICB0cmF2ZXJzZUNvbGxlY3Rpb25DdXJzb3I6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgZW50cmllc0xvYWRlZDogUHJvcFR5cGVzLmJvb2wsXG4gIH07XG5cbiAgY29tcG9uZW50RGlkTW91bnQoKSB7XG4gICAgY29uc3QgeyBjb2xsZWN0aW9uLCBlbnRyaWVzTG9hZGVkLCBsb2FkRW50cmllcyB9ID0gdGhpcy5wcm9wcztcbiAgICBpZiAoY29sbGVjdGlvbiAmJiAhZW50cmllc0xvYWRlZCkge1xuICAgICAgbG9hZEVudHJpZXMoY29sbGVjdGlvbik7XG4gICAgfVxuICB9XG5cbiAgY29tcG9uZW50RGlkVXBkYXRlKHByZXZQcm9wcykge1xuICAgIGNvbnN0IHsgY29sbGVjdGlvbiwgZW50cmllc0xvYWRlZCwgbG9hZEVudHJpZXMgfSA9IHRoaXMucHJvcHM7XG4gICAgaWYgKGNvbGxlY3Rpb24gIT09IHByZXZQcm9wcy5jb2xsZWN0aW9uICYmICFlbnRyaWVzTG9hZGVkKSB7XG4gICAgICBsb2FkRW50cmllcyhjb2xsZWN0aW9uKTtcbiAgICB9XG4gIH1cblxuICBoYW5kbGVDdXJzb3JBY3Rpb25zID0gKGN1cnNvciwgYWN0aW9uKSA9PiB7XG4gICAgY29uc3QgeyBjb2xsZWN0aW9uLCB0cmF2ZXJzZUNvbGxlY3Rpb25DdXJzb3IgfSA9IHRoaXMucHJvcHM7XG4gICAgdHJhdmVyc2VDb2xsZWN0aW9uQ3Vyc29yKGNvbGxlY3Rpb24sIGFjdGlvbik7XG4gIH07XG5cbiAgcmVuZGVyKCkge1xuICAgIGNvbnN0IHsgY29sbGVjdGlvbiwgZW50cmllcywgZ3JvdXBzLCBpc0ZldGNoaW5nLCB2aWV3U3R5bGUsIGN1cnNvciwgcGFnZSwgdCB9ID0gdGhpcy5wcm9wcztcblxuICAgIGNvbnN0IEVudHJpZXNUb1JlbmRlciA9ICh7IGVudHJpZXMgfSkgPT4ge1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgPEVudHJpZXNcbiAgICAgICAgICBjb2xsZWN0aW9ucz17Y29sbGVjdGlvbn1cbiAgICAgICAgICBlbnRyaWVzPXtlbnRyaWVzfVxuICAgICAgICAgIGlzRmV0Y2hpbmc9e2lzRmV0Y2hpbmd9XG4gICAgICAgICAgY29sbGVjdGlvbk5hbWU9e2NvbGxlY3Rpb24uZ2V0KCdsYWJlbCcpfVxuICAgICAgICAgIHZpZXdTdHlsZT17dmlld1N0eWxlfVxuICAgICAgICAgIGN1cnNvcj17Y3Vyc29yfVxuICAgICAgICAgIGhhbmRsZUN1cnNvckFjdGlvbnM9e3BhcnRpYWwodGhpcy5oYW5kbGVDdXJzb3JBY3Rpb25zLCBjdXJzb3IpfVxuICAgICAgICAgIHBhZ2U9e3BhZ2V9XG4gICAgICAgIC8+XG4gICAgICApO1xuICAgIH07XG5cbiAgICBpZiAoZ3JvdXBzICYmIGdyb3Vwcy5sZW5ndGggPiAwKSB7XG4gICAgICByZXR1cm4gd2l0aEdyb3Vwcyhncm91cHMsIGVudHJpZXMsIEVudHJpZXNUb1JlbmRlciwgdCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIDxFbnRyaWVzVG9SZW5kZXIgZW50cmllcz17ZW50cmllc30gLz47XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbHRlck5lc3RlZEVudHJpZXMocGF0aCwgY29sbGVjdGlvbkZvbGRlciwgZW50cmllcykge1xuICBjb25zdCBmaWx0ZXJlZCA9IGVudHJpZXMuZmlsdGVyKGUgPT4ge1xuICAgIGNvbnN0IGVudHJ5UGF0aCA9IGUuZ2V0KCdwYXRoJykuc2xpY2UoY29sbGVjdGlvbkZvbGRlci5sZW5ndGggKyAxKTtcbiAgICBpZiAoIWVudHJ5UGF0aC5zdGFydHNXaXRoKHBhdGgpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gb25seSBzaG93IGltbWVkaWF0ZSBjaGlsZHJlblxuICAgIGlmIChwYXRoKSB7XG4gICAgICAvLyBub24gcm9vdCBwYXRoXG4gICAgICBjb25zdCB0cmltbWVkID0gZW50cnlQYXRoLnNsaWNlKHBhdGgubGVuZ3RoICsgMSk7XG4gICAgICByZXR1cm4gdHJpbW1lZC5zcGxpdCgnLycpLmxlbmd0aCA9PT0gMjtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gcm9vdCBwYXRoXG4gICAgICByZXR1cm4gZW50cnlQYXRoLnNwbGl0KCcvJykubGVuZ3RoIDw9IDI7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIGZpbHRlcmVkO1xufVxuXG5mdW5jdGlvbiBtYXBTdGF0ZVRvUHJvcHMoc3RhdGUsIG93blByb3BzKSB7XG4gIGNvbnN0IHsgY29sbGVjdGlvbiwgdmlld1N0eWxlLCBmaWx0ZXJUZXJtIH0gPSBvd25Qcm9wcztcbiAgY29uc3QgcGFnZSA9IHN0YXRlLmVudHJpZXMuZ2V0SW4oWydwYWdlcycsIGNvbGxlY3Rpb24uZ2V0KCduYW1lJyksICdwYWdlJ10pO1xuXG4gIGxldCBlbnRyaWVzID0gc2VsZWN0RW50cmllcyhzdGF0ZS5lbnRyaWVzLCBjb2xsZWN0aW9uKTtcbiAgY29uc3QgZ3JvdXBzID0gc2VsZWN0R3JvdXBzKHN0YXRlLmVudHJpZXMsIGNvbGxlY3Rpb24pO1xuXG4gIGlmIChjb2xsZWN0aW9uLmhhcygnbmVzdGVkJykpIHtcbiAgICBjb25zdCBjb2xsZWN0aW9uRm9sZGVyID0gY29sbGVjdGlvbi5nZXQoJ2ZvbGRlcicpO1xuICAgIGVudHJpZXMgPSBmaWx0ZXJOZXN0ZWRFbnRyaWVzKGZpbHRlclRlcm0gfHwgJycsIGNvbGxlY3Rpb25Gb2xkZXIsIGVudHJpZXMpO1xuICB9XG4gIGNvbnN0IGVudHJpZXNMb2FkZWQgPSBzZWxlY3RFbnRyaWVzTG9hZGVkKHN0YXRlLmVudHJpZXMsIGNvbGxlY3Rpb24uZ2V0KCduYW1lJykpO1xuICBjb25zdCBpc0ZldGNoaW5nID0gc2VsZWN0SXNGZXRjaGluZyhzdGF0ZS5lbnRyaWVzLCBjb2xsZWN0aW9uLmdldCgnbmFtZScpKTtcblxuICBjb25zdCByYXdDdXJzb3IgPSBzZWxlY3RDb2xsZWN0aW9uRW50cmllc0N1cnNvcihzdGF0ZS5jdXJzb3JzLCBjb2xsZWN0aW9uLmdldCgnbmFtZScpKTtcbiAgY29uc3QgY3Vyc29yID0gQ3Vyc29yLmNyZWF0ZShyYXdDdXJzb3IpLmNsZWFyRGF0YSgpO1xuXG4gIHJldHVybiB7IGNvbGxlY3Rpb24sIHBhZ2UsIGVudHJpZXMsIGdyb3VwcywgZW50cmllc0xvYWRlZCwgaXNGZXRjaGluZywgdmlld1N0eWxlLCBjdXJzb3IgfTtcbn1cblxuY29uc3QgbWFwRGlzcGF0Y2hUb1Byb3BzID0ge1xuICBsb2FkRW50cmllczogYWN0aW9uTG9hZEVudHJpZXMsXG4gIHRyYXZlcnNlQ29sbGVjdGlvbkN1cnNvcjogYWN0aW9uVHJhdmVyc2VDb2xsZWN0aW9uQ3Vyc29yLFxufTtcblxuY29uc3QgQ29ubmVjdGVkRW50cmllc0NvbGxlY3Rpb24gPSBjb25uZWN0KG1hcFN0YXRlVG9Qcm9wcywgbWFwRGlzcGF0Y2hUb1Byb3BzKShFbnRyaWVzQ29sbGVjdGlvbik7XG5cbmV4cG9ydCBkZWZhdWx0IHRyYW5zbGF0ZSgpKENvbm5lY3RlZEVudHJpZXNDb2xsZWN0aW9uKTtcbiJdfQ== */");
function getGroupEntries(entries, paths) {
  return entries.filter(entry => paths.has(entry.get('path')));
}
function getGroupTitle(group, t) {
  const {
    label,
    value
  } = group;
  if (value === undefined) {
    return t('collection.groups.other');
  }
  if (typeof value === 'boolean') {
    return value ? label : t('collection.groups.negateLabel', {
      label
    });
  }
  return `${label} ${value}`.trim();
}
function withGroups(groups, entries, EntriesToRender, t) {
  return groups.map(group => {
    const title = getGroupTitle(group, t);
    return (0, _core.jsx)(GroupContainer, {
      key: group.id,
      id: group.id
    }, (0, _core.jsx)(GroupHeading, null, title), (0, _core.jsx)(EntriesToRender, {
      entries: getGroupEntries(entries, group.paths)
    }));
  });
}
class EntriesCollection extends _react.default.Component {
  constructor(...args) {
    super(...args);
    _defineProperty(this, "handleCursorActions", (cursor, action) => {
      const {
        collection,
        traverseCollectionCursor
      } = this.props;
      traverseCollectionCursor(collection, action);
    });
  }
  componentDidMount() {
    const {
      collection,
      entriesLoaded,
      loadEntries
    } = this.props;
    if (collection && !entriesLoaded) {
      loadEntries(collection);
    }
  }
  componentDidUpdate(prevProps) {
    const {
      collection,
      entriesLoaded,
      loadEntries
    } = this.props;
    if (collection !== prevProps.collection && !entriesLoaded) {
      loadEntries(collection);
    }
  }
  render() {
    const {
      collection,
      entries,
      groups,
      isFetching,
      viewStyle,
      cursor,
      page,
      t
    } = this.props;
    const EntriesToRender = ({
      entries
    }) => {
      return (0, _core.jsx)(_Entries.default, {
        collections: collection,
        entries: entries,
        isFetching: isFetching,
        collectionName: collection.get('label'),
        viewStyle: viewStyle,
        cursor: cursor,
        handleCursorActions: (0, _partial2.default)(this.handleCursorActions, cursor),
        page: page
      });
    };
    if (groups && groups.length > 0) {
      return withGroups(groups, entries, EntriesToRender, t);
    }
    return (0, _core.jsx)(EntriesToRender, {
      entries: entries
    });
  }
}
exports.EntriesCollection = EntriesCollection;
_defineProperty(EntriesCollection, "propTypes", {
  collection: _reactImmutableProptypes.default.map.isRequired,
  page: _propTypes.default.number,
  entries: _reactImmutableProptypes.default.list,
  groups: _propTypes.default.array,
  isFetching: _propTypes.default.bool.isRequired,
  viewStyle: _propTypes.default.string,
  cursor: _propTypes.default.object.isRequired,
  loadEntries: _propTypes.default.func.isRequired,
  traverseCollectionCursor: _propTypes.default.func.isRequired,
  entriesLoaded: _propTypes.default.bool
});
function filterNestedEntries(path, collectionFolder, entries) {
  const filtered = entries.filter(e => {
    const entryPath = e.get('path').slice(collectionFolder.length + 1);
    if (!entryPath.startsWith(path)) {
      return false;
    }

    // only show immediate children
    if (path) {
      // non root path
      const trimmed = entryPath.slice(path.length + 1);
      return trimmed.split('/').length === 2;
    } else {
      // root path
      return entryPath.split('/').length <= 2;
    }
  });
  return filtered;
}
function mapStateToProps(state, ownProps) {
  const {
    collection,
    viewStyle,
    filterTerm
  } = ownProps;
  const page = state.entries.getIn(['pages', collection.get('name'), 'page']);
  let entries = (0, _entries2.selectEntries)(state.entries, collection);
  const groups = (0, _entries2.selectGroups)(state.entries, collection);
  if (collection.has('nested')) {
    const collectionFolder = collection.get('folder');
    entries = filterNestedEntries(filterTerm || '', collectionFolder, entries);
  }
  const entriesLoaded = (0, _entries2.selectEntriesLoaded)(state.entries, collection.get('name'));
  const isFetching = (0, _entries2.selectIsFetching)(state.entries, collection.get('name'));
  const rawCursor = (0, _cursors.selectCollectionEntriesCursor)(state.cursors, collection.get('name'));
  const cursor = _decapCmsLibUtil.Cursor.create(rawCursor).clearData();
  return {
    collection,
    page,
    entries,
    groups,
    entriesLoaded,
    isFetching,
    viewStyle,
    cursor
  };
}
const mapDispatchToProps = {
  loadEntries: _entries.loadEntries,
  traverseCollectionCursor: _entries.traverseCollectionCursor
};
const ConnectedEntriesCollection = (0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(EntriesCollection);
var _default = (0, _reactPolyglot.translate)()(ConnectedEntriesCollection);
exports.default = _default;