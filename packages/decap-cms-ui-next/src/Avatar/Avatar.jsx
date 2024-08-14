import React from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/react';

import Icon from '../Icon';

const StylesAvatar = styled.div`
  ${({ theme, size }) => css`
    border-radius: ${size === 'xs' ? 20 : size === 'sm' ? 24 : size === 'lg' ? 40 : 32}px;
    width: ${size === 'xs' ? 20 : size === 'sm' ? 24 : size === 'lg' ? 40 : 32}px;
    height: ${size === 'xs' ? 20 : size === 'sm' ? 24 : size === 'lg' ? 40 : 32}px;
    transition: 200ms;
    background-color: ${theme.color.primary['900']};
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
  `}
`;

const StylesImage = styled(StylesAvatar)`
  ${({ src }) => css`
    background-image: url(${src});
    background-size: cover;
    background-position: center;
  `}
`;

const StylesFallback = styled.span`
  ${({ size }) => css`
    font-size: ${size === 'xs' ? 10 : size === 'sm' ? 12 : size === 'lg' ? 20 : 16}px;
    color: #ffffff;
  `}
`;

function Avatar({ size, src, fallback, ...props }) {
  const formattedFallback = fallback
    ? fallback
        .toUpperCase()
        .split(' ')
        .map(word => word[0])
        .join('')
    : '';

  return src ? (
    <StylesImage size={size} src={src} {...props} />
  ) : fallback ? (
    <StylesAvatar size={size} {...props}>
      <StylesFallback size={size} {...props}>
        {formattedFallback}
      </StylesFallback>
    </StylesAvatar>
  ) : (
    <StylesAvatar size={size} {...props}>
      <Icon name="user" />
    </StylesAvatar>
  );
}

export default Avatar;
