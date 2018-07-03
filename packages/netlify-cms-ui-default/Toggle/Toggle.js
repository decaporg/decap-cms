import _extends from 'babel-runtime/helpers/extends';

(function () {
  var enterModule = require('react-hot-loader').enterModule;

  enterModule && enterModule(module);
})();

import React from 'react';
import ReactToggled from 'react-toggled';
import c from 'classnames';

export var Toggle = function Toggle(_ref) {
  var active = _ref.active,
      onChange = _ref.onChange,
      className = _ref.className,
      classNameBackground = _ref.classNameBackground,
      classNameSwitch = _ref.classNameSwitch,
      onFocus = _ref.onFocus,
      onBlur = _ref.onBlur;
  return React.createElement(
    ReactToggled,
    { on: active, onToggle: onChange },
    function (_ref2) {
      var on = _ref2.on,
          getElementTogglerProps = _ref2.getElementTogglerProps;
      return React.createElement(
        'span',
        _extends({
          className: c('nc-toggle', className, { 'nc-toggle-active': on }),
          role: 'switch',
          'aria-checked': on.toString(),
          onFocus: onFocus,
          onBlur: onBlur
        }, getElementTogglerProps()),
        React.createElement('span', { className: 'nc-toggle-background ' + classNameBackground }),
        React.createElement('span', { className: 'nc-toggle-switch ' + classNameSwitch })
      );
    }
  );
};
;

(function () {
  var reactHotLoader = require('react-hot-loader').default;

  var leaveModule = require('react-hot-loader').leaveModule;

  if (!reactHotLoader) {
    return;
  }

  reactHotLoader.register(Toggle, 'Toggle', 'src/Toggle/Toggle.js');
  leaveModule(module);
})();

;