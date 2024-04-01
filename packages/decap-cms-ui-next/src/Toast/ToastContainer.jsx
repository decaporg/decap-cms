import React from 'react';
import { ToastContainer as ReactToastifyContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.minimal.css';
import styled from '@emotion/styled';
import { useTheme } from '@emotion/react';

import ToastTransition from './ToastTransition';

const StyledToastContainer = styled(ReactToastifyContainer)`
  /** Used to define container behavior: width, position: fixed etc... **/
  &&&.Toastify__toast-container {
    z-index: 9999;
    position: fixed;
    width: 400px;
    box-sizing: border-box;
    ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
      width: calc(100vw - 16px);
    }
  }

  /** Used to define the position of the ToastContainer **/
  &&&.Toastify__toast-container--top-left {
    top: 1em;
    left: 24px;
    ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
      left: 16px;
    }
  }
  &&&.Toastify__toast-container--top-center {
    top: 1em;
    left: 50%;
    transform: translateX(-50%);
  }
  &&&.Toastify__toast-container--top-right {
    top: 1em;
    right: 24px;
    ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
      right: 16px;
    }
  }
  &&&.Toastify__toast-container--bottom-left {
    bottom: 12px;
    left: 24px;
    ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
      left: 16px;
    }
  }
  &&&.Toastify__toast-container--bottom-center {
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
  }
  &&&.Toastify__toast-container--bottom-right {
    bottom: 12px;
    right: 24px;
    ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
      right: 16px;
    }
  }
`;

function ToastContainer({ position = 'bottom-right' }) {
  const theme = useTheme();

  return (
    <StyledToastContainer
      theme={theme}
      position={position}
      closeButton={false}
      transition={ToastTransition}
    />
  );
}

export default ToastContainer;
