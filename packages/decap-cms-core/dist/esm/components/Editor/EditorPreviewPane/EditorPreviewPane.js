"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.PreviewPane = void 0;
var _styledBase = _interopRequireDefault(require("@emotion/styled-base"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireDefault(require("react"));
var _immutable = require("immutable");
var _reactImmutableProptypes = _interopRequireDefault(require("react-immutable-proptypes"));
var _reactFrameComponent = _interopRequireWildcard(require("react-frame-component"));
var _decapCmsUiDefault = require("decap-cms-ui-default");
var _reactRedux = require("react-redux");
var _registry = require("../../../lib/registry");
var _UI = require("../../UI");
var _collections = require("../../../reducers/collections");
var _media = require("../../../actions/media");
var _medias = require("../../../reducers/medias");
var _fieldInference = require("../../../constants/fieldInference");
var _EditorPreviewContent = _interopRequireDefault(require("./EditorPreviewContent.js"));
var _PreviewHOC = _interopRequireDefault(require("./PreviewHOC"));
var _EditorPreview = _interopRequireDefault(require("./EditorPreview"));
var _core = require("@emotion/core");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
const PreviewPaneFrame = ( /*#__PURE__*/0, _styledBase.default)(_reactFrameComponent.default, {
  target: "enus48h0",
  label: "PreviewPaneFrame"
})("width:100%;height:100%;border:none;background:#fff;border-radius:", _decapCmsUiDefault.lengths.borderRadius, ";" + (process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL0VkaXRvci9FZGl0b3JQcmV2aWV3UGFuZS9FZGl0b3JQcmV2aWV3UGFuZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUF3QnNDIiwiZmlsZSI6Ii4uLy4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL0VkaXRvci9FZGl0b3JQcmV2aWV3UGFuZS9FZGl0b3JQcmV2aWV3UGFuZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHN0eWxlZCBmcm9tICdAZW1vdGlvbi9zdHlsZWQnO1xuaW1wb3J0IHsgTGlzdCwgTWFwIH0gZnJvbSAnaW1tdXRhYmxlJztcbmltcG9ydCBJbW11dGFibGVQcm9wVHlwZXMgZnJvbSAncmVhY3QtaW1tdXRhYmxlLXByb3B0eXBlcyc7XG5pbXBvcnQgRnJhbWUsIHsgRnJhbWVDb250ZXh0Q29uc3VtZXIgfSBmcm9tICdyZWFjdC1mcmFtZS1jb21wb25lbnQnO1xuaW1wb3J0IHsgbGVuZ3RocyB9IGZyb20gJ2RlY2FwLWNtcy11aS1kZWZhdWx0JztcbmltcG9ydCB7IGNvbm5lY3QgfSBmcm9tICdyZWFjdC1yZWR1eCc7XG5cbmltcG9ydCB7XG4gIHJlc29sdmVXaWRnZXQsXG4gIGdldFByZXZpZXdUZW1wbGF0ZSxcbiAgZ2V0UHJldmlld1N0eWxlcyxcbiAgZ2V0UmVtYXJrUGx1Z2lucyxcbn0gZnJvbSAnLi4vLi4vLi4vbGliL3JlZ2lzdHJ5JztcbmltcG9ydCB7IEVycm9yQm91bmRhcnkgfSBmcm9tICcuLi8uLi9VSSc7XG5pbXBvcnQgeyBzZWxlY3RUZW1wbGF0ZU5hbWUsIHNlbGVjdEluZmVyZWRGaWVsZCwgc2VsZWN0RmllbGQgfSBmcm9tICcuLi8uLi8uLi9yZWR1Y2Vycy9jb2xsZWN0aW9ucyc7XG5pbXBvcnQgeyBib3VuZEdldEFzc2V0IH0gZnJvbSAnLi4vLi4vLi4vYWN0aW9ucy9tZWRpYSc7XG5pbXBvcnQgeyBzZWxlY3RJc0xvYWRpbmdBc3NldCB9IGZyb20gJy4uLy4uLy4uL3JlZHVjZXJzL21lZGlhcyc7XG5pbXBvcnQgeyBJTkZFUkFCTEVfRklFTERTIH0gZnJvbSAnLi4vLi4vLi4vY29uc3RhbnRzL2ZpZWxkSW5mZXJlbmNlJztcbmltcG9ydCBFZGl0b3JQcmV2aWV3Q29udGVudCBmcm9tICcuL0VkaXRvclByZXZpZXdDb250ZW50LmpzJztcbmltcG9ydCBQcmV2aWV3SE9DIGZyb20gJy4vUHJldmlld0hPQyc7XG5pbXBvcnQgRWRpdG9yUHJldmlldyBmcm9tICcuL0VkaXRvclByZXZpZXcnO1xuXG5jb25zdCBQcmV2aWV3UGFuZUZyYW1lID0gc3R5bGVkKEZyYW1lKWBcbiAgd2lkdGg6IDEwMCU7XG4gIGhlaWdodDogMTAwJTtcbiAgYm9yZGVyOiBub25lO1xuICBiYWNrZ3JvdW5kOiAjZmZmO1xuICBib3JkZXItcmFkaXVzOiAke2xlbmd0aHMuYm9yZGVyUmFkaXVzfTtcbmA7XG5cbmV4cG9ydCBjbGFzcyBQcmV2aWV3UGFuZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIGdldFdpZGdldCA9IChmaWVsZCwgdmFsdWUsIG1ldGFkYXRhLCBwcm9wcywgaWR4ID0gbnVsbCkgPT4ge1xuICAgIGNvbnN0IHsgZ2V0QXNzZXQsIGVudHJ5IH0gPSBwcm9wcztcbiAgICBjb25zdCB3aWRnZXQgPSByZXNvbHZlV2lkZ2V0KGZpZWxkLmdldCgnd2lkZ2V0JykpO1xuICAgIGNvbnN0IGtleSA9IGlkeCA/IGZpZWxkLmdldCgnbmFtZScpICsgJ18nICsgaWR4IDogZmllbGQuZ2V0KCduYW1lJyk7XG4gICAgY29uc3QgdmFsdWVJc0luTWFwID0gdmFsdWUgJiYgIXdpZGdldC5hbGxvd01hcFZhbHVlICYmIE1hcC5pc01hcCh2YWx1ZSk7XG5cbiAgICAvKipcbiAgICAgKiBVc2UgYW4gSE9DIHRvIHByb3ZpZGUgY29uZGl0aW9uYWwgdXBkYXRlcyBmb3IgYWxsIHByZXZpZXdzLlxuICAgICAqL1xuICAgIHJldHVybiAhd2lkZ2V0LnByZXZpZXcgPyBudWxsIDogKFxuICAgICAgPFByZXZpZXdIT0NcbiAgICAgICAgcHJldmlld0NvbXBvbmVudD17d2lkZ2V0LnByZXZpZXd9XG4gICAgICAgIGtleT17a2V5fVxuICAgICAgICBmaWVsZD17ZmllbGR9XG4gICAgICAgIGdldEFzc2V0PXtnZXRBc3NldH1cbiAgICAgICAgdmFsdWU9e3ZhbHVlSXNJbk1hcCA/IHZhbHVlLmdldChmaWVsZC5nZXQoJ25hbWUnKSkgOiB2YWx1ZX1cbiAgICAgICAgZW50cnk9e2VudHJ5fVxuICAgICAgICBmaWVsZHNNZXRhRGF0YT17bWV0YWRhdGF9XG4gICAgICAgIHJlc29sdmVXaWRnZXQ9e3Jlc29sdmVXaWRnZXR9XG4gICAgICAgIGdldFJlbWFya1BsdWdpbnM9e2dldFJlbWFya1BsdWdpbnN9XG4gICAgICAvPlxuICAgICk7XG4gIH07XG5cbiAgaW5mZXJlZEZpZWxkcyA9IHt9O1xuXG4gIGluZmVyRmllbGRzKCkge1xuICAgIGNvbnN0IHRpdGxlRmllbGQgPSBzZWxlY3RJbmZlcmVkRmllbGQodGhpcy5wcm9wcy5jb2xsZWN0aW9uLCAndGl0bGUnKTtcbiAgICBjb25zdCBzaG9ydFRpdGxlRmllbGQgPSBzZWxlY3RJbmZlcmVkRmllbGQodGhpcy5wcm9wcy5jb2xsZWN0aW9uLCAnc2hvcnRUaXRsZScpO1xuICAgIGNvbnN0IGF1dGhvckZpZWxkID0gc2VsZWN0SW5mZXJlZEZpZWxkKHRoaXMucHJvcHMuY29sbGVjdGlvbiwgJ2F1dGhvcicpO1xuXG4gICAgdGhpcy5pbmZlcmVkRmllbGRzID0ge307XG4gICAgaWYgKHRpdGxlRmllbGQpIHRoaXMuaW5mZXJlZEZpZWxkc1t0aXRsZUZpZWxkXSA9IElORkVSQUJMRV9GSUVMRFMudGl0bGU7XG4gICAgaWYgKHNob3J0VGl0bGVGaWVsZCkgdGhpcy5pbmZlcmVkRmllbGRzW3Nob3J0VGl0bGVGaWVsZF0gPSBJTkZFUkFCTEVfRklFTERTLnNob3J0VGl0bGU7XG4gICAgaWYgKGF1dGhvckZpZWxkKSB0aGlzLmluZmVyZWRGaWVsZHNbYXV0aG9yRmllbGRdID0gSU5GRVJBQkxFX0ZJRUxEUy5hdXRob3I7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgd2lkZ2V0IGNvbXBvbmVudCBmb3IgYSBuYW1lZCBmaWVsZCwgYW5kIG1ha2VzIHJlY3Vyc2l2ZSBjYWxsc1xuICAgKiB0byByZXRyaWV2ZSBjb21wb25lbnRzIGZvciBuZXN0ZWQgYW5kIGRlZXBseSBuZXN0ZWQgZmllbGRzLCB3aGljaCBvY2N1ciBpblxuICAgKiBvYmplY3QgYW5kIGxpc3QgdHlwZSBmaWVsZHMuIFVzZWQgaW50ZXJuYWxseSB0byByZXRyaWV2ZSB3aWRnZXRzLCBhbmQgYWxzb1xuICAgKiBleHBvc2VkIGZvciB1c2UgaW4gY3VzdG9tIHByZXZpZXcgdGVtcGxhdGVzLlxuICAgKi9cbiAgd2lkZ2V0Rm9yID0gKFxuICAgIG5hbWUsXG4gICAgZmllbGRzID0gdGhpcy5wcm9wcy5maWVsZHMsXG4gICAgdmFsdWVzID0gdGhpcy5wcm9wcy5lbnRyeS5nZXQoJ2RhdGEnKSxcbiAgICBmaWVsZHNNZXRhRGF0YSA9IHRoaXMucHJvcHMuZmllbGRzTWV0YURhdGEsXG4gICkgPT4ge1xuICAgIC8vIFdlIHJldHJpZXZlIHRoZSBmaWVsZCBieSBuYW1lIHNvIHRoYXQgdGhpcyBmdW5jdGlvbiBjYW4gYWxzbyBiZSB1c2VkIGluXG4gICAgLy8gY3VzdG9tIHByZXZpZXcgdGVtcGxhdGVzLCB3aGVyZSB0aGUgZmllbGQgb2JqZWN0IGNhbid0IGJlIHBhc3NlZCBpbi5cbiAgICBsZXQgZmllbGQgPSBmaWVsZHMgJiYgZmllbGRzLmZpbmQoZiA9PiBmLmdldCgnbmFtZScpID09PSBuYW1lKTtcbiAgICBsZXQgdmFsdWUgPSBNYXAuaXNNYXAodmFsdWVzKSAmJiB2YWx1ZXMuZ2V0KGZpZWxkLmdldCgnbmFtZScpKTtcbiAgICBpZiAoZmllbGQuZ2V0KCdtZXRhJykpIHtcbiAgICAgIHZhbHVlID0gdGhpcy5wcm9wcy5lbnRyeS5nZXRJbihbJ21ldGEnLCBmaWVsZC5nZXQoJ25hbWUnKV0pO1xuICAgIH1cbiAgICBjb25zdCBuZXN0ZWRGaWVsZHMgPSBmaWVsZC5nZXQoJ2ZpZWxkcycpO1xuICAgIGNvbnN0IHNpbmdsZUZpZWxkID0gZmllbGQuZ2V0KCdmaWVsZCcpO1xuICAgIGNvbnN0IG1ldGFkYXRhID0gZmllbGRzTWV0YURhdGEgJiYgZmllbGRzTWV0YURhdGEuZ2V0KGZpZWxkLmdldCgnbmFtZScpLCBNYXAoKSk7XG5cbiAgICBpZiAobmVzdGVkRmllbGRzKSB7XG4gICAgICBmaWVsZCA9IGZpZWxkLnNldCgnZmllbGRzJywgdGhpcy5nZXROZXN0ZWRXaWRnZXRzKG5lc3RlZEZpZWxkcywgdmFsdWUsIG1ldGFkYXRhKSk7XG4gICAgfVxuXG4gICAgaWYgKHNpbmdsZUZpZWxkKSB7XG4gICAgICBmaWVsZCA9IGZpZWxkLnNldCgnZmllbGQnLCB0aGlzLmdldFNpbmdsZU5lc3RlZChzaW5nbGVGaWVsZCwgdmFsdWUsIG1ldGFkYXRhKSk7XG4gICAgfVxuXG4gICAgY29uc3QgbGFiZWxsZWRXaWRnZXRzID0gWydzdHJpbmcnLCAndGV4dCcsICdudW1iZXInXTtcbiAgICBjb25zdCBpbmZlcmVkRmllbGQgPSBPYmplY3QuZW50cmllcyh0aGlzLmluZmVyZWRGaWVsZHMpXG4gICAgICAuZmlsdGVyKChba2V5XSkgPT4ge1xuICAgICAgICBjb25zdCBmaWVsZFRvTWF0Y2ggPSBzZWxlY3RGaWVsZCh0aGlzLnByb3BzLmNvbGxlY3Rpb24sIGtleSk7XG4gICAgICAgIHJldHVybiBmaWVsZFRvTWF0Y2ggPT09IGZpZWxkO1xuICAgICAgfSlcbiAgICAgIC5tYXAoKFssIHZhbHVlXSkgPT4gdmFsdWUpWzBdO1xuXG4gICAgaWYgKGluZmVyZWRGaWVsZCkge1xuICAgICAgdmFsdWUgPSBpbmZlcmVkRmllbGQuZGVmYXVsdFByZXZpZXcodmFsdWUpO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICB2YWx1ZSAmJlxuICAgICAgbGFiZWxsZWRXaWRnZXRzLmluZGV4T2YoZmllbGQuZ2V0KCd3aWRnZXQnKSkgIT09IC0xICYmXG4gICAgICB2YWx1ZS50b1N0cmluZygpLmxlbmd0aCA8IDUwXG4gICAgKSB7XG4gICAgICB2YWx1ZSA9IChcbiAgICAgICAgPGRpdj5cbiAgICAgICAgICA8c3Ryb25nPntmaWVsZC5nZXQoJ2xhYmVsJywgZmllbGQuZ2V0KCduYW1lJykpfTo8L3N0cm9uZz4ge3ZhbHVlfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbHVlID8gdGhpcy5nZXRXaWRnZXQoZmllbGQsIHZhbHVlLCBtZXRhZGF0YSwgdGhpcy5wcm9wcykgOiBudWxsO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgd2lkZ2V0cyBmb3IgbmVzdGVkIGZpZWxkcyAoY2hpbGRyZW4gb2Ygb2JqZWN0L2xpc3QgZmllbGRzKVxuICAgKi9cbiAgZ2V0TmVzdGVkV2lkZ2V0cyA9IChmaWVsZHMsIHZhbHVlcywgZmllbGRzTWV0YURhdGEpID0+IHtcbiAgICAvLyBGaWVsZHMgbmVzdGVkIHdpdGhpbiBhIGxpc3QgZmllbGQgd2lsbCBiZSBwYWlyZWQgd2l0aCBhIExpc3Qgb2YgdmFsdWUgTWFwcy5cbiAgICBpZiAoTGlzdC5pc0xpc3QodmFsdWVzKSkge1xuICAgICAgcmV0dXJuIHZhbHVlcy5tYXAodmFsdWUgPT4gdGhpcy53aWRnZXRzRm9yTmVzdGVkRmllbGRzKGZpZWxkcywgdmFsdWUsIGZpZWxkc01ldGFEYXRhKSk7XG4gICAgfVxuICAgIC8vIEZpZWxkcyBuZXN0ZWQgd2l0aGluIGFuIG9iamVjdCBmaWVsZCB3aWxsIGJlIHBhaXJlZCB3aXRoIGEgc2luZ2xlIE1hcCBvZiB2YWx1ZXMuXG4gICAgcmV0dXJuIHRoaXMud2lkZ2V0c0Zvck5lc3RlZEZpZWxkcyhmaWVsZHMsIHZhbHVlcywgZmllbGRzTWV0YURhdGEpO1xuICB9O1xuXG4gIGdldFNpbmdsZU5lc3RlZCA9IChmaWVsZCwgdmFsdWVzLCBmaWVsZHNNZXRhRGF0YSkgPT4ge1xuICAgIGlmIChMaXN0LmlzTGlzdCh2YWx1ZXMpKSB7XG4gICAgICByZXR1cm4gdmFsdWVzLm1hcCgodmFsdWUsIGlkeCkgPT5cbiAgICAgICAgdGhpcy5nZXRXaWRnZXQoZmllbGQsIHZhbHVlLCBmaWVsZHNNZXRhRGF0YS5nZXQoZmllbGQuZ2V0KCduYW1lJykpLCB0aGlzLnByb3BzLCBpZHgpLFxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZ2V0V2lkZ2V0KGZpZWxkLCB2YWx1ZXMsIGZpZWxkc01ldGFEYXRhLmdldChmaWVsZC5nZXQoJ25hbWUnKSksIHRoaXMucHJvcHMpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBVc2Ugd2lkZ2V0Rm9yIGFzIGEgbWFwcGluZyBmdW5jdGlvbiBmb3IgcmVjdXJzaXZlIHdpZGdldCByZXRyaWV2YWxcbiAgICovXG4gIHdpZGdldHNGb3JOZXN0ZWRGaWVsZHMgPSAoZmllbGRzLCB2YWx1ZXMsIGZpZWxkc01ldGFEYXRhKSA9PiB7XG4gICAgcmV0dXJuIGZpZWxkcy5tYXAoZmllbGQgPT4gdGhpcy53aWRnZXRGb3IoZmllbGQuZ2V0KCduYW1lJyksIGZpZWxkcywgdmFsdWVzLCBmaWVsZHNNZXRhRGF0YSkpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBUaGlzIGZ1bmN0aW9uIGV4aXN0cyBlbnRpcmVseSB0byBleHBvc2UgbmVzdGVkIHdpZGdldHMgZm9yIG9iamVjdCBhbmQgbGlzdFxuICAgKiBmaWVsZHMgdG8gY3VzdG9tIHByZXZpZXcgdGVtcGxhdGVzLlxuICAgKlxuICAgKiBUT0RPOiBzZWUgaWYgd2lkZ2V0Rm9yIGNhbiBub3cgcHJvdmlkZSB0aGlzIGZ1bmN0aW9uYWxpdHkgZm9yIHByZXZpZXcgdGVtcGxhdGVzXG4gICAqL1xuICB3aWRnZXRzRm9yID0gbmFtZSA9PiB7XG4gICAgY29uc3QgeyBmaWVsZHMsIGVudHJ5LCBmaWVsZHNNZXRhRGF0YSB9ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCBmaWVsZCA9IGZpZWxkcy5maW5kKGYgPT4gZi5nZXQoJ25hbWUnKSA9PT0gbmFtZSk7XG4gICAgY29uc3QgbmVzdGVkRmllbGRzID0gZmllbGQgJiYgZmllbGQuZ2V0KCdmaWVsZHMnKTtcbiAgICBjb25zdCB2YWx1ZSA9IGVudHJ5LmdldEluKFsnZGF0YScsIGZpZWxkLmdldCgnbmFtZScpXSk7XG4gICAgY29uc3QgbWV0YWRhdGEgPSBmaWVsZHNNZXRhRGF0YS5nZXQoZmllbGQuZ2V0KCduYW1lJyksIE1hcCgpKTtcblxuICAgIGlmIChMaXN0LmlzTGlzdCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiB2YWx1ZS5tYXAodmFsID0+IHtcbiAgICAgICAgY29uc3Qgd2lkZ2V0cyA9XG4gICAgICAgICAgbmVzdGVkRmllbGRzICYmXG4gICAgICAgICAgTWFwKFxuICAgICAgICAgICAgbmVzdGVkRmllbGRzLm1hcCgoZiwgaSkgPT4gW1xuICAgICAgICAgICAgICBmLmdldCgnbmFtZScpLFxuICAgICAgICAgICAgICA8ZGl2IGtleT17aX0+e3RoaXMuZ2V0V2lkZ2V0KGYsIHZhbCwgbWV0YWRhdGEuZ2V0KGYuZ2V0KCduYW1lJykpLCB0aGlzLnByb3BzKX08L2Rpdj4sXG4gICAgICAgICAgICBdKSxcbiAgICAgICAgICApO1xuICAgICAgICByZXR1cm4gTWFwKHsgZGF0YTogdmFsLCB3aWRnZXRzIH0pO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIE1hcCh7XG4gICAgICBkYXRhOiB2YWx1ZSxcbiAgICAgIHdpZGdldHM6XG4gICAgICAgIG5lc3RlZEZpZWxkcyAmJlxuICAgICAgICBNYXAoXG4gICAgICAgICAgbmVzdGVkRmllbGRzLm1hcChmID0+IFtcbiAgICAgICAgICAgIGYuZ2V0KCduYW1lJyksXG4gICAgICAgICAgICB0aGlzLmdldFdpZGdldChmLCB2YWx1ZSwgbWV0YWRhdGEuZ2V0KGYuZ2V0KCduYW1lJykpLCB0aGlzLnByb3BzKSxcbiAgICAgICAgICBdKSxcbiAgICAgICAgKSxcbiAgICB9KTtcbiAgfTtcblxuICByZW5kZXIoKSB7XG4gICAgY29uc3QgeyBlbnRyeSwgY29sbGVjdGlvbiwgY29uZmlnIH0gPSB0aGlzLnByb3BzO1xuXG4gICAgaWYgKCFlbnRyeSB8fCAhZW50cnkuZ2V0KCdkYXRhJykpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IHByZXZpZXdDb21wb25lbnQgPVxuICAgICAgZ2V0UHJldmlld1RlbXBsYXRlKHNlbGVjdFRlbXBsYXRlTmFtZShjb2xsZWN0aW9uLCBlbnRyeS5nZXQoJ3NsdWcnKSkpIHx8IEVkaXRvclByZXZpZXc7XG5cbiAgICB0aGlzLmluZmVyRmllbGRzKCk7XG5cbiAgICBjb25zdCBwcmV2aWV3UHJvcHMgPSB7XG4gICAgICAuLi50aGlzLnByb3BzLFxuICAgICAgd2lkZ2V0Rm9yOiB0aGlzLndpZGdldEZvcixcbiAgICAgIHdpZGdldHNGb3I6IHRoaXMud2lkZ2V0c0ZvcixcbiAgICB9O1xuXG4gICAgY29uc3Qgc3R5bGVFbHMgPSBnZXRQcmV2aWV3U3R5bGVzKCkubWFwKChzdHlsZSwgaSkgPT4ge1xuICAgICAgaWYgKHN0eWxlLnJhdykge1xuICAgICAgICByZXR1cm4gPHN0eWxlIGtleT17aX0+e3N0eWxlLnZhbHVlfTwvc3R5bGU+O1xuICAgICAgfVxuICAgICAgcmV0dXJuIDxsaW5rIGtleT17aX0gaHJlZj17c3R5bGUudmFsdWV9IHR5cGU9XCJ0ZXh0L2Nzc1wiIHJlbD1cInN0eWxlc2hlZXRcIiAvPjtcbiAgICB9KTtcblxuICAgIGlmICghY29sbGVjdGlvbikge1xuICAgICAgPFByZXZpZXdQYW5lRnJhbWUgaWQ9XCJwcmV2aWV3LXBhbmVcIiBoZWFkPXtzdHlsZUVsc30gLz47XG4gICAgfVxuXG4gICAgY29uc3QgaW5pdGlhbENvbnRlbnQgPSBgXG48IURPQ1RZUEUgaHRtbD5cbjxodG1sPlxuICA8aGVhZD48YmFzZSB0YXJnZXQ9XCJfYmxhbmtcIi8+PC9oZWFkPlxuICA8Ym9keT48ZGl2PjwvZGl2PjwvYm9keT5cbjwvaHRtbD5cbmA7XG5cbiAgICByZXR1cm4gKFxuICAgICAgPEVycm9yQm91bmRhcnkgY29uZmlnPXtjb25maWd9PlxuICAgICAgICA8UHJldmlld1BhbmVGcmFtZSBpZD1cInByZXZpZXctcGFuZVwiIGhlYWQ9e3N0eWxlRWxzfSBpbml0aWFsQ29udGVudD17aW5pdGlhbENvbnRlbnR9PlxuICAgICAgICAgIDxGcmFtZUNvbnRleHRDb25zdW1lcj5cbiAgICAgICAgICAgIHsoeyBkb2N1bWVudCwgd2luZG93IH0pID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICA8RWRpdG9yUHJldmlld0NvbnRlbnRcbiAgICAgICAgICAgICAgICAgIHsuLi57IHByZXZpZXdDb21wb25lbnQsIHByZXZpZXdQcm9wczogeyAuLi5wcmV2aWV3UHJvcHMsIGRvY3VtZW50LCB3aW5kb3cgfSB9fVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9fVxuICAgICAgICAgIDwvRnJhbWVDb250ZXh0Q29uc3VtZXI+XG4gICAgICAgIDwvUHJldmlld1BhbmVGcmFtZT5cbiAgICAgIDwvRXJyb3JCb3VuZGFyeT5cbiAgICApO1xuICB9XG59XG5cblByZXZpZXdQYW5lLnByb3BUeXBlcyA9IHtcbiAgY29sbGVjdGlvbjogSW1tdXRhYmxlUHJvcFR5cGVzLm1hcC5pc1JlcXVpcmVkLFxuICBmaWVsZHM6IEltbXV0YWJsZVByb3BUeXBlcy5saXN0LmlzUmVxdWlyZWQsXG4gIGVudHJ5OiBJbW11dGFibGVQcm9wVHlwZXMubWFwLmlzUmVxdWlyZWQsXG4gIGZpZWxkc01ldGFEYXRhOiBJbW11dGFibGVQcm9wVHlwZXMubWFwLmlzUmVxdWlyZWQsXG4gIGdldEFzc2V0OiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxufTtcblxuZnVuY3Rpb24gbWFwU3RhdGVUb1Byb3BzKHN0YXRlKSB7XG4gIGNvbnN0IGlzTG9hZGluZ0Fzc2V0ID0gc2VsZWN0SXNMb2FkaW5nQXNzZXQoc3RhdGUubWVkaWFzKTtcbiAgcmV0dXJuIHsgaXNMb2FkaW5nQXNzZXQsIGNvbmZpZzogc3RhdGUuY29uZmlnIH07XG59XG5cbmZ1bmN0aW9uIG1hcERpc3BhdGNoVG9Qcm9wcyhkaXNwYXRjaCkge1xuICByZXR1cm4ge1xuICAgIGJvdW5kR2V0QXNzZXQ6IChjb2xsZWN0aW9uLCBlbnRyeSkgPT4gYm91bmRHZXRBc3NldChkaXNwYXRjaCwgY29sbGVjdGlvbiwgZW50cnkpLFxuICB9O1xufVxuXG5mdW5jdGlvbiBtZXJnZVByb3BzKHN0YXRlUHJvcHMsIGRpc3BhdGNoUHJvcHMsIG93blByb3BzKSB7XG4gIHJldHVybiB7XG4gICAgLi4uc3RhdGVQcm9wcyxcbiAgICAuLi5kaXNwYXRjaFByb3BzLFxuICAgIC4uLm93blByb3BzLFxuICAgIGdldEFzc2V0OiBkaXNwYXRjaFByb3BzLmJvdW5kR2V0QXNzZXQob3duUHJvcHMuY29sbGVjdGlvbiwgb3duUHJvcHMuZW50cnkpLFxuICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBjb25uZWN0KG1hcFN0YXRlVG9Qcm9wcywgbWFwRGlzcGF0Y2hUb1Byb3BzLCBtZXJnZVByb3BzKShQcmV2aWV3UGFuZSk7XG4iXX0= */"));
class PreviewPane extends _react.default.Component {
  constructor(...args) {
    super(...args);
    _defineProperty(this, "getWidget", (field, value, metadata, props, idx = null) => {
      const {
        getAsset,
        entry
      } = props;
      const widget = (0, _registry.resolveWidget)(field.get('widget'));
      const key = idx ? field.get('name') + '_' + idx : field.get('name');
      const valueIsInMap = value && !widget.allowMapValue && _immutable.Map.isMap(value);

      /**
       * Use an HOC to provide conditional updates for all previews.
       */
      return !widget.preview ? null : (0, _core.jsx)(_PreviewHOC.default, {
        previewComponent: widget.preview,
        key: key,
        field: field,
        getAsset: getAsset,
        value: valueIsInMap ? value.get(field.get('name')) : value,
        entry: entry,
        fieldsMetaData: metadata,
        resolveWidget: _registry.resolveWidget,
        getRemarkPlugins: _registry.getRemarkPlugins
      });
    });
    _defineProperty(this, "inferedFields", {});
    /**
     * Returns the widget component for a named field, and makes recursive calls
     * to retrieve components for nested and deeply nested fields, which occur in
     * object and list type fields. Used internally to retrieve widgets, and also
     * exposed for use in custom preview templates.
     */
    _defineProperty(this, "widgetFor", (name, fields = this.props.fields, values = this.props.entry.get('data'), fieldsMetaData = this.props.fieldsMetaData) => {
      // We retrieve the field by name so that this function can also be used in
      // custom preview templates, where the field object can't be passed in.
      let field = fields && fields.find(f => f.get('name') === name);
      let value = _immutable.Map.isMap(values) && values.get(field.get('name'));
      if (field.get('meta')) {
        value = this.props.entry.getIn(['meta', field.get('name')]);
      }
      const nestedFields = field.get('fields');
      const singleField = field.get('field');
      const metadata = fieldsMetaData && fieldsMetaData.get(field.get('name'), (0, _immutable.Map)());
      if (nestedFields) {
        field = field.set('fields', this.getNestedWidgets(nestedFields, value, metadata));
      }
      if (singleField) {
        field = field.set('field', this.getSingleNested(singleField, value, metadata));
      }
      const labelledWidgets = ['string', 'text', 'number'];
      const inferedField = Object.entries(this.inferedFields).filter(([key]) => {
        const fieldToMatch = (0, _collections.selectField)(this.props.collection, key);
        return fieldToMatch === field;
      }).map(([, value]) => value)[0];
      if (inferedField) {
        value = inferedField.defaultPreview(value);
      } else if (value && labelledWidgets.indexOf(field.get('widget')) !== -1 && value.toString().length < 50) {
        value = (0, _core.jsx)("div", null, (0, _core.jsx)("strong", null, field.get('label', field.get('name')), ":"), " ", value);
      }
      return value ? this.getWidget(field, value, metadata, this.props) : null;
    });
    /**
     * Retrieves widgets for nested fields (children of object/list fields)
     */
    _defineProperty(this, "getNestedWidgets", (fields, values, fieldsMetaData) => {
      // Fields nested within a list field will be paired with a List of value Maps.
      if (_immutable.List.isList(values)) {
        return values.map(value => this.widgetsForNestedFields(fields, value, fieldsMetaData));
      }
      // Fields nested within an object field will be paired with a single Map of values.
      return this.widgetsForNestedFields(fields, values, fieldsMetaData);
    });
    _defineProperty(this, "getSingleNested", (field, values, fieldsMetaData) => {
      if (_immutable.List.isList(values)) {
        return values.map((value, idx) => this.getWidget(field, value, fieldsMetaData.get(field.get('name')), this.props, idx));
      }
      return this.getWidget(field, values, fieldsMetaData.get(field.get('name')), this.props);
    });
    /**
     * Use widgetFor as a mapping function for recursive widget retrieval
     */
    _defineProperty(this, "widgetsForNestedFields", (fields, values, fieldsMetaData) => {
      return fields.map(field => this.widgetFor(field.get('name'), fields, values, fieldsMetaData));
    });
    /**
     * This function exists entirely to expose nested widgets for object and list
     * fields to custom preview templates.
     *
     * TODO: see if widgetFor can now provide this functionality for preview templates
     */
    _defineProperty(this, "widgetsFor", name => {
      const {
        fields,
        entry,
        fieldsMetaData
      } = this.props;
      const field = fields.find(f => f.get('name') === name);
      const nestedFields = field && field.get('fields');
      const value = entry.getIn(['data', field.get('name')]);
      const metadata = fieldsMetaData.get(field.get('name'), (0, _immutable.Map)());
      if (_immutable.List.isList(value)) {
        return value.map(val => {
          const widgets = nestedFields && (0, _immutable.Map)(nestedFields.map((f, i) => [f.get('name'), (0, _core.jsx)("div", {
            key: i
          }, this.getWidget(f, val, metadata.get(f.get('name')), this.props))]));
          return (0, _immutable.Map)({
            data: val,
            widgets
          });
        });
      }
      return (0, _immutable.Map)({
        data: value,
        widgets: nestedFields && (0, _immutable.Map)(nestedFields.map(f => [f.get('name'), this.getWidget(f, value, metadata.get(f.get('name')), this.props)]))
      });
    });
  }
  inferFields() {
    const titleField = (0, _collections.selectInferedField)(this.props.collection, 'title');
    const shortTitleField = (0, _collections.selectInferedField)(this.props.collection, 'shortTitle');
    const authorField = (0, _collections.selectInferedField)(this.props.collection, 'author');
    this.inferedFields = {};
    if (titleField) this.inferedFields[titleField] = _fieldInference.INFERABLE_FIELDS.title;
    if (shortTitleField) this.inferedFields[shortTitleField] = _fieldInference.INFERABLE_FIELDS.shortTitle;
    if (authorField) this.inferedFields[authorField] = _fieldInference.INFERABLE_FIELDS.author;
  }
  render() {
    const {
      entry,
      collection,
      config
    } = this.props;
    if (!entry || !entry.get('data')) {
      return null;
    }
    const previewComponent = (0, _registry.getPreviewTemplate)((0, _collections.selectTemplateName)(collection, entry.get('slug'))) || _EditorPreview.default;
    this.inferFields();
    const previewProps = _objectSpread(_objectSpread({}, this.props), {}, {
      widgetFor: this.widgetFor,
      widgetsFor: this.widgetsFor
    });
    const styleEls = (0, _registry.getPreviewStyles)().map((style, i) => {
      if (style.raw) {
        return (0, _core.jsx)("style", {
          key: i
        }, style.value);
      }
      return (0, _core.jsx)("link", {
        key: i,
        href: style.value,
        type: "text/css",
        rel: "stylesheet"
      });
    });
    if (!collection) {
      (0, _core.jsx)(PreviewPaneFrame, {
        id: "preview-pane",
        head: styleEls
      });
    }
    const initialContent = `
<!DOCTYPE html>
<html>
  <head><base target="_blank"/></head>
  <body><div></div></body>
</html>
`;
    return (0, _core.jsx)(_UI.ErrorBoundary, {
      config: config
    }, (0, _core.jsx)(PreviewPaneFrame, {
      id: "preview-pane",
      head: styleEls,
      initialContent: initialContent
    }, (0, _core.jsx)(_reactFrameComponent.FrameContextConsumer, null, ({
      document,
      window
    }) => {
      return (0, _core.jsx)(_EditorPreviewContent.default, {
        previewComponent,
        previewProps: _objectSpread(_objectSpread({}, previewProps), {}, {
          document,
          window
        })
      });
    })));
  }
}
exports.PreviewPane = PreviewPane;
PreviewPane.propTypes = {
  collection: _reactImmutableProptypes.default.map.isRequired,
  fields: _reactImmutableProptypes.default.list.isRequired,
  entry: _reactImmutableProptypes.default.map.isRequired,
  fieldsMetaData: _reactImmutableProptypes.default.map.isRequired,
  getAsset: _propTypes.default.func.isRequired
};
function mapStateToProps(state) {
  const isLoadingAsset = (0, _medias.selectIsLoadingAsset)(state.medias);
  return {
    isLoadingAsset,
    config: state.config
  };
}
function mapDispatchToProps(dispatch) {
  return {
    boundGetAsset: (collection, entry) => (0, _media.boundGetAsset)(dispatch, collection, entry)
  };
}
function mergeProps(stateProps, dispatchProps, ownProps) {
  return _objectSpread(_objectSpread(_objectSpread(_objectSpread({}, stateProps), dispatchProps), ownProps), {}, {
    getAsset: dispatchProps.boundGetAsset(ownProps.collection, ownProps.entry)
  });
}
var _default = (0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps, mergeProps)(PreviewPane);
exports.default = _default;