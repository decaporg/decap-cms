"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.editorStyleVars = exports.EditorControlBar = void 0;
var _styledBase = _interopRequireDefault(require("@emotion/styled-base"));
var _decapCmsUiDefault = require("decap-cms-ui-default");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const editorStyleVars = {
  stickyDistanceBottom: '100px'
};
exports.editorStyleVars = editorStyleVars;
const EditorControlBar = (0, _styledBase.default)("div", {
  target: "ehaqqzm0",
  label: "EditorControlBar"
})("z-index:", _decapCmsUiDefault.zIndex.zIndex200, ";position:sticky;top:0;margin-bottom:", editorStyleVars.stickyDistanceBottom, ";" + (process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zdHlsZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBTzBDIiwiZmlsZSI6Ii4uLy4uL3NyYy9zdHlsZXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgc3R5bGVkIGZyb20gJ0BlbW90aW9uL3N0eWxlZCc7XG5pbXBvcnQgeyB6SW5kZXggfSBmcm9tICdkZWNhcC1jbXMtdWktZGVmYXVsdCc7XG5cbmV4cG9ydCBjb25zdCBlZGl0b3JTdHlsZVZhcnMgPSB7XG4gIHN0aWNreURpc3RhbmNlQm90dG9tOiAnMTAwcHgnLFxufTtcblxuZXhwb3J0IGNvbnN0IEVkaXRvckNvbnRyb2xCYXIgPSBzdHlsZWQuZGl2YFxuICB6LWluZGV4OiAke3pJbmRleC56SW5kZXgyMDB9O1xuICBwb3NpdGlvbjogc3RpY2t5O1xuICB0b3A6IDA7XG4gIG1hcmdpbi1ib3R0b206ICR7ZWRpdG9yU3R5bGVWYXJzLnN0aWNreURpc3RhbmNlQm90dG9tfTtcbmA7XG4iXX0= */"));
exports.EditorControlBar = EditorControlBar;