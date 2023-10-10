"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireDefault(require("react"));
var _reactPolyglot = require("react-polyglot");
var _decapCmsUiDefault = require("decap-cms-ui-default");
var _redux = require("../../types/redux");
var _ControlButton = require("./ControlButton");
var _core = require("@emotion/core");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
function nextSortDirection(direction) {
  switch (direction) {
    case _redux.SortDirection.Ascending:
      return _redux.SortDirection.Descending;
    case _redux.SortDirection.Descending:
      return _redux.SortDirection.None;
    default:
      return _redux.SortDirection.Ascending;
  }
}
function sortIconProps(sortDir) {
  return {
    icon: 'chevron',
    iconDirection: sortIconDirections[sortDir],
    iconSmall: true
  };
}
const sortIconDirections = {
  [_redux.SortDirection.Ascending]: 'up',
  [_redux.SortDirection.Descending]: 'down'
};
function SortControl({
  t,
  fields,
  onSortClick,
  sort
}) {
  const hasActiveSort = sort === null || sort === void 0 ? void 0 : sort.valueSeq().toJS().some(s => s.direction !== _redux.SortDirection.None);
  return (0, _core.jsx)(_decapCmsUiDefault.Dropdown, {
    renderButton: () => {
      return (0, _core.jsx)(_ControlButton.ControlButton, {
        active: hasActiveSort,
        title: t('collection.collectionTop.sortBy')
      });
    },
    closeOnSelection: false,
    dropdownTopOverlap: "30px",
    dropdownWidth: "160px",
    dropdownPosition: "left"
  }, fields.map(field => {
    const sortDir = sort === null || sort === void 0 ? void 0 : sort.getIn([field.key, 'direction']);
    const isActive = sortDir && sortDir !== _redux.SortDirection.None;
    const nextSortDir = nextSortDirection(sortDir);
    return (0, _core.jsx)(_decapCmsUiDefault.DropdownItem, _extends({
      key: field.key,
      label: field.label,
      onClick: () => onSortClick(field.key, nextSortDir),
      isActive: isActive
    }, isActive && sortIconProps(sortDir)));
  }));
}
var _default = (0, _reactPolyglot.translate)()(SortControl);
exports.default = _default;