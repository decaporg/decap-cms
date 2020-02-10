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
 * Map icon definition objects - imported object of images simply maps the icon
 * name to the raw svg, so we move that to the `image` property of the
 * definition object and set any additional configured properties for each icon.
 */
const icons = mapValues(images, image => {
  return { image };
});

export default icons;
