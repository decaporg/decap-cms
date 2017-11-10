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
const getRotation = (iconDirection, newDirection) => {
  if (!iconDirection || !newDirection) {
    return '0deg';
  }
  const rotations = { right: 90, down: 180, left: 270, up: 360 };
  const degrees = rotations[newDirection] - rotations[iconDirection];
  return `${degrees}deg`;
}

const Icon = props => {
  const { type, direction, size = 'medium', className = '', ...remainingProps } = props;
  const icon = icons[type];
  const rotation = getRotation(icon.direction, direction)
  const transform = `rotate(${rotation})`;
  const style = { transform };
  return (
    <span
      dangerouslySetInnerHTML={{ __html: icon.image }}
      className={`nc-icon nc-icon-${size} ${className}`}
      style={style}
      {...remainingProps}
    ></span>
  );
}

export default Icon;
