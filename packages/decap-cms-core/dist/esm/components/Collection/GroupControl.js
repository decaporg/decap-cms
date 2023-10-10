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
function GroupControl({
  viewGroups,
  t,
  onGroupClick,
  group
}) {
  const hasActiveGroup = group === null || group === void 0 ? void 0 : group.valueSeq().toJS().some(f => f.active === true);
  return (0, _core.jsx)(_decapCmsUiDefault.Dropdown, {
    renderButton: () => {
      return (0, _core.jsx)(_ControlButton.ControlButton, {
        active: hasActiveGroup,
        title: t('collection.collectionTop.groupBy')
      });
    },
    closeOnSelection: false,
    dropdownTopOverlap: "30px",
    dropdownWidth: "160px",
    dropdownPosition: "left"
  }, viewGroups.map(viewGroup => {
    return (0, _core.jsx)(_decapCmsUiDefault.DropdownItem, {
      key: viewGroup.id,
      label: viewGroup.label,
      onClick: () => onGroupClick(viewGroup),
      isActive: group.getIn([viewGroup.id, 'active'], false)
    });
  }));
}
var _default = (0, _reactPolyglot.translate)()(GroupControl);
exports.default = _default;