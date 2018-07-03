import _extends from 'babel-runtime/helpers/extends';
import _objectWithoutProperties from 'babel-runtime/helpers/objectWithoutProperties';

(function () {
  var enterModule = require('react-hot-loader').enterModule;

  enterModule && enterModule(module);
})();

import React from 'react';
import icons from './icons';

/**
 * Calculates rotation for icons that have a `direction` property configured
 * in the imported icon definition object. If no direction is configured, a
 * neutral rotation value is returned.
 *
 * Returned value is a string of shape `${degrees}deg`, for use in a CSS
 * transform.
 */
var getRotation = function getRotation(iconDirection, newDirection) {
  if (!iconDirection || !newDirection) {
    return '0deg';
  }
  var rotations = { right: 90, down: 180, left: 270, up: 360 };
  var degrees = rotations[newDirection] - rotations[iconDirection];
  return degrees + 'deg';
};

var sizes = {
  xsmall: '12px',
  small: '18px',
  medium: '24px',
  large: '32px'
};

var Icon = function Icon(props) {
  var type = props.type,
      direction = props.direction,
      _props$size = props.size,
      size = _props$size === undefined ? 'medium' : _props$size,
      _props$className = props.className,
      className = _props$className === undefined ? '' : _props$className,
      width = props.width,
      height = props.height,
      remainingProps = _objectWithoutProperties(props, ['type', 'direction', 'size', 'className', 'width', 'height']);

  var icon = icons[type];
  var rotation = getRotation(icon.direction, direction);
  var transform = 'rotate(' + rotation + ')';
  var sizeResolved = sizes[size] || size;
  var style = { width: sizeResolved, height: sizeResolved, transform: transform };
  return React.createElement(
    'span',
    _extends({ className: 'nc-icon ' + className }, remainingProps),
    React.createElement('span', { dangerouslySetInnerHTML: { __html: icon.image }, style: style })
  );
};
export { Icon };
;

(function () {
  var reactHotLoader = require('react-hot-loader').default;

  var leaveModule = require('react-hot-loader').leaveModule;

  if (!reactHotLoader) {
    return;
  }

  reactHotLoader.register(getRotation, 'getRotation', 'src/Icon/Icon.js');
  reactHotLoader.register(sizes, 'sizes', 'src/Icon/Icon.js');
  reactHotLoader.register(Icon, 'Icon', 'src/Icon/Icon.js');
  leaveModule(module);
})();

;