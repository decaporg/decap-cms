import React from 'react';
import styled from '@emotion/styled';

const FullscreenWrap = styled.div`
  ${({ isFullscreen, theme }) =>
    isFullscreen
      ? `
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 99999;
    background-color: ${theme.color.surface};
  `
      : ``}
`;

const Fullscreen = ({ isFullscreen, children, className }) => {
  return (
    <FullscreenWrap className={className} isFullscreen={isFullscreen}>
      {children}
    </FullscreenWrap>
  );
};

export default Fullscreen;
