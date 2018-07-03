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

const sizes = {
  xsmall: '12px',
  small: '18px',
  medium: '24px',
  large: '32px',
};

export const Icon = props => {
  const {
    type,
    direction,
    size = 'medium',
    className = '',
    width,
    height,
    ...remainingProps
  } = props;
  const icon = icons[type];
  const rotation = getRotation(icon.direction, direction)
  const transform = `rotate(${rotation})`;
  const sizeResolved = sizes[size] || size;
  const style = { width: sizeResolved, height: sizeResolved, transform };
  return (
    <span className={`nc-icon ${className}`} {...remainingProps}>
      <span dangerouslySetInnerHTML={{ __html: icon.image }} style={style}></span>
    </span>
  );
}
