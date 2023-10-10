"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _styledBase = _interopRequireDefault(require("@emotion/styled-base"));
var _react = _interopRequireDefault(require("react"));
var _decapCmsUiDefault = require("decap-cms-ui-default");
var _ViewStyleControl = _interopRequireDefault(require("./ViewStyleControl"));
var _SortControl = _interopRequireDefault(require("./SortControl"));
var _FilterControl = _interopRequireDefault(require("./FilterControl"));
var _GroupControl = _interopRequireDefault(require("./GroupControl"));
var _core = require("@emotion/core");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const CollectionControlsContainer = (0, _styledBase.default)("div", {
  target: "emfmed70",
  label: "CollectionControlsContainer"
})("display:flex;align-items:center;flex-direction:row-reverse;margin-top:22px;width:", _decapCmsUiDefault.lengths.topCardWidth, ";max-width:100%;& > div{margin-left:6px;}" + (process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL0NvbGxlY3Rpb24vQ29sbGVjdGlvbkNvbnRyb2xzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVM4QyIsImZpbGUiOiIuLi8uLi8uLi8uLi9zcmMvY29tcG9uZW50cy9Db2xsZWN0aW9uL0NvbGxlY3Rpb25Db250cm9scy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgc3R5bGVkIGZyb20gJ0BlbW90aW9uL3N0eWxlZCc7XG5pbXBvcnQgeyBsZW5ndGhzIH0gZnJvbSAnZGVjYXAtY21zLXVpLWRlZmF1bHQnO1xuXG5pbXBvcnQgVmlld1N0eWxlQ29udHJvbCBmcm9tICcuL1ZpZXdTdHlsZUNvbnRyb2wnO1xuaW1wb3J0IFNvcnRDb250cm9sIGZyb20gJy4vU29ydENvbnRyb2wnO1xuaW1wb3J0IEZpbHRlckNvbnRyb2wgZnJvbSAnLi9GaWx0ZXJDb250cm9sJztcbmltcG9ydCBHcm91cENvbnRyb2wgZnJvbSAnLi9Hcm91cENvbnRyb2wnO1xuXG5jb25zdCBDb2xsZWN0aW9uQ29udHJvbHNDb250YWluZXIgPSBzdHlsZWQuZGl2YFxuICBkaXNwbGF5OiBmbGV4O1xuICBhbGlnbi1pdGVtczogY2VudGVyO1xuICBmbGV4LWRpcmVjdGlvbjogcm93LXJldmVyc2U7XG4gIG1hcmdpbi10b3A6IDIycHg7XG4gIHdpZHRoOiAke2xlbmd0aHMudG9wQ2FyZFdpZHRofTtcbiAgbWF4LXdpZHRoOiAxMDAlO1xuXG4gICYgPiBkaXYge1xuICAgIG1hcmdpbi1sZWZ0OiA2cHg7XG4gIH1cbmA7XG5cbmZ1bmN0aW9uIENvbGxlY3Rpb25Db250cm9scyh7XG4gIHZpZXdTdHlsZSxcbiAgb25DaGFuZ2VWaWV3U3R5bGUsXG4gIHNvcnRhYmxlRmllbGRzLFxuICBvblNvcnRDbGljayxcbiAgc29ydCxcbiAgdmlld0ZpbHRlcnMsXG4gIHZpZXdHcm91cHMsXG4gIG9uRmlsdGVyQ2xpY2ssXG4gIG9uR3JvdXBDbGljayxcbiAgdCxcbiAgZmlsdGVyLFxuICBncm91cCxcbn0pIHtcbiAgcmV0dXJuIChcbiAgICA8Q29sbGVjdGlvbkNvbnRyb2xzQ29udGFpbmVyPlxuICAgICAgPFZpZXdTdHlsZUNvbnRyb2wgdmlld1N0eWxlPXt2aWV3U3R5bGV9IG9uQ2hhbmdlVmlld1N0eWxlPXtvbkNoYW5nZVZpZXdTdHlsZX0gLz5cbiAgICAgIHt2aWV3R3JvdXBzLmxlbmd0aCA+IDAgJiYgKFxuICAgICAgICA8R3JvdXBDb250cm9sIHZpZXdHcm91cHM9e3ZpZXdHcm91cHN9IG9uR3JvdXBDbGljaz17b25Hcm91cENsaWNrfSB0PXt0fSBncm91cD17Z3JvdXB9IC8+XG4gICAgICApfVxuICAgICAge3ZpZXdGaWx0ZXJzLmxlbmd0aCA+IDAgJiYgKFxuICAgICAgICA8RmlsdGVyQ29udHJvbFxuICAgICAgICAgIHZpZXdGaWx0ZXJzPXt2aWV3RmlsdGVyc31cbiAgICAgICAgICBvbkZpbHRlckNsaWNrPXtvbkZpbHRlckNsaWNrfVxuICAgICAgICAgIHQ9e3R9XG4gICAgICAgICAgZmlsdGVyPXtmaWx0ZXJ9XG4gICAgICAgIC8+XG4gICAgICApfVxuICAgICAge3NvcnRhYmxlRmllbGRzLmxlbmd0aCA+IDAgJiYgKFxuICAgICAgICA8U29ydENvbnRyb2wgZmllbGRzPXtzb3J0YWJsZUZpZWxkc30gc29ydD17c29ydH0gb25Tb3J0Q2xpY2s9e29uU29ydENsaWNrfSAvPlxuICAgICAgKX1cbiAgICA8L0NvbGxlY3Rpb25Db250cm9sc0NvbnRhaW5lcj5cbiAgKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29sbGVjdGlvbkNvbnRyb2xzO1xuIl19 */"));
function CollectionControls({
  viewStyle,
  onChangeViewStyle,
  sortableFields,
  onSortClick,
  sort,
  viewFilters,
  viewGroups,
  onFilterClick,
  onGroupClick,
  t,
  filter,
  group
}) {
  return (0, _core.jsx)(CollectionControlsContainer, null, (0, _core.jsx)(_ViewStyleControl.default, {
    viewStyle: viewStyle,
    onChangeViewStyle: onChangeViewStyle
  }), viewGroups.length > 0 && (0, _core.jsx)(_GroupControl.default, {
    viewGroups: viewGroups,
    onGroupClick: onGroupClick,
    t: t,
    group: group
  }), viewFilters.length > 0 && (0, _core.jsx)(_FilterControl.default, {
    viewFilters: viewFilters,
    onFilterClick: onFilterClick,
    t: t,
    filter: filter
  }), sortableFields.length > 0 && (0, _core.jsx)(_SortControl.default, {
    fields: sortableFields,
    sort: sort,
    onSortClick: onSortClick
  }));
}
var _default = CollectionControls;
exports.default = _default;