import React from 'react';
import styled from '@emotion/styled';

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
`}
`;

const StylesImage = styled(StylesAvatar)`
  ${({ src }) => `
  background-image: url(${src});
  background-size: cover;
  background-position: center;
  `}
`;

const StylesInitials = styled.span`
  ${({ size }) => `
    font-size: ${size === 'sm' ? 12 : size === 'lg' ? 20 : 16}px;
    color: #FFFFFF;
  `}
`;

function Avatar({ size, src, initials, ...props }) {
  const hasImage = src;

  return hasImage ? (
    <StylesImage size={size} src={src} {...props} />
  ) : (
    <StylesAvatar size={size} {...props}>
      <StylesInitials size={size} {...props}>
        {initials}
      </StylesInitials>
    </StylesAvatar>
  );
}

export default Avatar;
