import React from 'react';
import styled from '@emotion/styled';

import Icon from '../Icon';

const StylesAvatar = styled.div`
  ${({ theme, size }) => `
  border-radius: ${size === 'sm' ? 24 : size === 'lg' ? 40 : 32}px;
  width: ${size === 'sm' ? 24 : size === 'lg' ? 40 : 32}px;
  height: ${size === 'sm' ? 24 : size === 'lg' ? 40 : 32}px;
  transition: 200ms;
  background-color: ${theme.color.primary['900']};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.color.highEmphasis};
`}
`;

const StylesImage = styled(StylesAvatar)`
  ${({ src }) => `
  background-image: url(${src});
  background-size: cover;
  background-position: center;
  `}
`;

const StylesFallback = styled.span`
  ${({ size }) => `
    font-size: ${size === 'sm' ? 12 : size === 'lg' ? 20 : 16}px;
    color: #FFFFFF;
  `}
`;

function Avatar({ size, src, fallback, ...props }) {
  return src ? (
    <StylesImage size={size} src={src} {...props} />
  ) : fallback ? (
    <StylesAvatar size={size} {...props}>
      <StylesFallback size={size} {...props}>
        {fallback}
      </StylesFallback>
    </StylesAvatar>
  ) : (
    <StylesAvatar size={size} {...props}>
      <Icon name="user" />
    </StylesAvatar>
  );
}

export default Avatar;
