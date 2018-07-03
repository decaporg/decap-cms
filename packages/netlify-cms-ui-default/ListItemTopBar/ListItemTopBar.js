(function () {
  var enterModule = require('react-hot-loader').enterModule;

  enterModule && enterModule(module);
})();

import React from 'react';
import c from 'classnames';
import { Icon } from '../Icon/Icon';

export var ListItemTopBar = function ListItemTopBar(_ref) {
  var collapsed = _ref.collapsed,
      onCollapseToggle = _ref.onCollapseToggle,
      onRemove = _ref.onRemove,
      dragHandleHOC = _ref.dragHandleHOC,
      className = _ref.className;

  var DragHandle = dragHandleHOC && dragHandleHOC(function () {
    return React.createElement(
      'span',
      { className: 'nc-listItemTopBar-dragIcon' },
      React.createElement(Icon, { type: 'drag-handle', size: 'small' })
    );
  });

  return React.createElement(
    'div',
    { className: c('nc-listItemTopBar', className) },
    onCollapseToggle ? React.createElement(
      'button',
      { className: 'nc-listItemTopBar-toggleButton', onClick: onCollapseToggle },
      React.createElement(Icon, { type: 'chevron', size: 'small', direction: collapsed ? 'right' : 'down' })
    ) : null,
    dragHandleHOC ? React.createElement(DragHandle, null) : null,
    onRemove ? React.createElement(
      'button',
      { className: 'nc-listItemTopBar-removeButton', onClick: onRemove },
      React.createElement(Icon, { type: 'close', size: 'small' })
    ) : null
  );
};
;

(function () {
  var reactHotLoader = require('react-hot-loader').default;

  var leaveModule = require('react-hot-loader').leaveModule;

  if (!reactHotLoader) {
    return;
  }

  reactHotLoader.register(ListItemTopBar, 'ListItemTopBar', 'src/ListItemTopBar/ListItemTopBar.js');
  leaveModule(module);
})();

;