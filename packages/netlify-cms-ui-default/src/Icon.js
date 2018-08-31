import React from 'react';
import PropTypes from 'prop-types';
import styled from 'react-emotion';
import icons from './Icon/icons';

const IconWrapper = styled.span`
  display: inline-block;
  line-height: 0;
  width: ${props => props.size};
  height: ${props => props.size};
  transform: ${props => `rotate(${props.rotation})`};

  & path:not(.no-fill),
  & circle:not(.no-fill),
  & polygon:not(.no-fill),
  & rect:not(.no-fill) {
    fill: currentColor;
  }

  & path.clipped {
    fill: transparent;
  }

  svg {
    width: 100%;
    height: 100%;
  }
`;

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
};

const sizes = {
  xsmall: '12px',
  small: '18px',
  medium: '24px',
  large: '32px',
};

const Icon = ({ type, direction, size = 'medium', className }) => (
  <IconWrapper
    className={className}
    dangerouslySetInnerHTML={{ __html: icons[type].image }}
    size={sizes[size] || size}
    rotation={getRotation(icons[type].direction, direction)}
  />
);

Icon.propTypes = {
  type: PropTypes.string.isRequired,
  direction: PropTypes.oneOf(['right', 'down', 'left', 'up']),
  size: PropTypes.string,
  className: PropTypes.string,
};

export default styled(Icon)``;
