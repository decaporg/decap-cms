import _extends from 'babel-runtime/helpers/extends';

(function () {
  var enterModule = require('react-hot-loader').enterModule;

  enterModule && enterModule(module);
})();

import mapValues from 'lodash/mapValues';
import images from './images/_index';

/**
 * This module outputs icon objects with the following shape:
 *
 * {
 *   image: <svg>...</svg>,
 *   ...props
 * }
 *
 * `props` here are config properties defined in this file for specific icons.
 * For example, an icon may face a specific direction, and the Icon component
 * accepts a `direction` prop to rotate directional icons, which relies on
 * defining the default direction here.
 */

/**
 * Configuration for individual icons.
 */
var config = {
  'arrow': {
    direction: 'left'
  },
  'chevron': {
    direction: 'down'
  },
  'chevron-double': {
    direction: 'down'
  }
};

/**
 * Map icon definition objects - imported object of images simply maps the icon
 * name to the raw svg, so we move that to the `image` property of the
 * definition object and set any additional configured properties for each icon.
 */
var icons = mapValues(images, function (image, name) {
  var props = config[name] || {};
  return _extends({ image: image }, props);
});

var _default = icons;
export default _default;
;

(function () {
  var reactHotLoader = require('react-hot-loader').default;

  var leaveModule = require('react-hot-loader').leaveModule;

  if (!reactHotLoader) {
    return;
  }

  reactHotLoader.register(config, 'config', 'src/Icon/icons.js');
  reactHotLoader.register(icons, 'icons', 'src/Icon/icons.js');
  reactHotLoader.register(_default, 'default', 'src/Icon/icons.js');
  leaveModule(module);
})();

;