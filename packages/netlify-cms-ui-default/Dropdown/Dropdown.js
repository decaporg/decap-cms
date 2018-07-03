(function () {
  var enterModule = require('react-hot-loader').enterModule;

  enterModule && enterModule(module);
})();

import React from 'react';
import PropTypes from 'prop-types';
import c from 'classnames';
import { Wrapper, Button, Menu, MenuItem } from 'react-aria-menubutton';
import { Icon } from '../Icon/Icon';

var Dropdown = function Dropdown(_ref) {
  var label = _ref.label,
      button = _ref.button,
      className = _ref.className,
      _ref$classNameButton = _ref.classNameButton,
      classNameButton = _ref$classNameButton === undefined ? '' : _ref$classNameButton,
      _ref$dropdownWidth = _ref.dropdownWidth,
      dropdownWidth = _ref$dropdownWidth === undefined ? 'auto' : _ref$dropdownWidth,
      _ref$dropdownPosition = _ref.dropdownPosition,
      dropdownPosition = _ref$dropdownPosition === undefined ? 'left' : _ref$dropdownPosition,
      _ref$dropdownTopOverl = _ref.dropdownTopOverlap,
      dropdownTopOverlap = _ref$dropdownTopOverl === undefined ? '0' : _ref$dropdownTopOverl,
      children = _ref.children;

  var style = {
    width: dropdownWidth,
    top: dropdownTopOverlap,
    left: dropdownPosition === 'left' ? 0 : 'auto',
    right: dropdownPosition === 'right' ? 0 : 'auto'
  };
  return React.createElement(
    Wrapper,
    { className: c('nc-dropdown', className), onSelection: function onSelection(handler) {
        return handler();
      } },
    button ? React.createElement(
      Button,
      null,
      button
    ) : React.createElement(
      Button,
      { className: c('nc-dropdownButton', classNameButton) },
      label
    ),
    React.createElement(
      Menu,
      null,
      React.createElement(
        'ul',
        { className: 'nc-dropdownList', style: style },
        children
      )
    )
  );
};

var DropdownItem = function DropdownItem(_ref2) {
  var label = _ref2.label,
      icon = _ref2.icon,
      iconDirection = _ref2.iconDirection,
      onClick = _ref2.onClick,
      className = _ref2.className;
  return React.createElement(
    MenuItem,
    { className: c('nc-dropdownItem', className), value: onClick },
    React.createElement(
      'span',
      null,
      label
    ),
    icon ? React.createElement(
      'span',
      { className: 'nc-dropdownItemIcon' },
      React.createElement(Icon, { type: icon, direction: iconDirection, size: 'small' })
    ) : null
  );
};

export { Dropdown, DropdownItem };
;

(function () {
  var reactHotLoader = require('react-hot-loader').default;

  var leaveModule = require('react-hot-loader').leaveModule;

  if (!reactHotLoader) {
    return;
  }

  reactHotLoader.register(Dropdown, 'Dropdown', 'src/Dropdown/Dropdown.js');
  reactHotLoader.register(DropdownItem, 'DropdownItem', 'src/Dropdown/Dropdown.js');
  leaveModule(module);
})();

;