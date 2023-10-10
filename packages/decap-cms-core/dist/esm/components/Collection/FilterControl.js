"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireDefault(require("react"));
var _reactPolyglot = require("react-polyglot");
var _decapCmsUiDefault = require("decap-cms-ui-default");
var _ControlButton = require("./ControlButton");
var _core = require("@emotion/core");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function FilterControl({
  viewFilters,
  t,
  onFilterClick,
  filter
}) {
  const hasActiveFilter = filter === null || filter === void 0 ? void 0 : filter.valueSeq().toJS().some(f => f.active === true);
  return (0, _core.jsx)(_decapCmsUiDefault.Dropdown, {
    renderButton: () => {
      return (0, _core.jsx)(_ControlButton.ControlButton, {
        active: hasActiveFilter,
        title: t('collection.collectionTop.filterBy')
      });
    },
    closeOnSelection: false,
    dropdownTopOverlap: "30px",
    dropdownPosition: "left"
  }, viewFilters.map(viewFilter => {
    return (0, _core.jsx)(_decapCmsUiDefault.DropdownCheckedItem, {
      key: viewFilter.id,
      label: viewFilter.label,
      id: viewFilter.id,
      checked: filter.getIn([viewFilter.id, 'active'], false),
      onClick: () => onFilterClick(viewFilter)
    });
  }));
}
var _default = (0, _reactPolyglot.translate)()(FilterControl);
exports.default = _default;