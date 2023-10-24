import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import color from 'color';
import Fade from '../transitions/Fade';

const StyledBackdrop = styled.div`
  z-index: -1;
  position: fixed;
  right: 0;
  bottom: 0;
  top: 0;
  left: 0;
  background-color: ${({ theme, invisible }) =>
    invisible
      ? 'transparent'
      : theme.darkMode
      ? color(theme.color.neutral['1600'])
          .alpha(0.5)
          .string()
      : 'rgba(14,30,37,0.25)'};
  -webkit-tap-highlight-color: transparent;
  touch-action: none;
`;

const Backdrop = props => {
  const { invisible, open, transitionDuration, onClick, ...other } = props;

  return (
    <Fade in={open} timeout={transitionDuration} {...other}>
      <StyledBackdrop invisible={invisible} onClick={onClick} aria-hidden="true" />
    </Fade>
  );
};

Backdrop.propTypes = {
  invisible: PropTypes.bool,
  open: PropTypes.bool.isRequired,
  transitionDuration: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.shape({ enter: PropTypes.number, exit: PropTypes.number }),
  ]),
};

Backdrop.defaultProps = {
  invisible: false,
};

export default Backdrop;
