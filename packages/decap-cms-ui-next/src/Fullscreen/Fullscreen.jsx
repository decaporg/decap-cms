import React from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/react';

const FullscreenWrap = styled.div`
  ${({ isFullscreen, theme }) =>
    isFullscreen
      ? css`
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

function Fullscreen({ isFullscreen, children, className }) {
  return (
    <FullscreenWrap className={className} isFullscreen={isFullscreen}>
      {children}
    </FullscreenWrap>
  );
}

export default Fullscreen;
