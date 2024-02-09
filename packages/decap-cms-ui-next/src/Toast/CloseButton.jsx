import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';

import { IconButton } from '../Buttons';

const StyledCloseButton = styled(IconButton)`
  align-self: flex-start;
`;

StyledCloseButton.defaultProps = {
  icon: 'close',
};

function CloseButton({ closeToast, ariaLabel }) {
  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    closeToast();
  }

  return <StyledCloseButton onClick={handleClick} ariaLabel={ariaLabel} />;
}

CloseButton.propTypes = {
  closeToast: PropTypes.func,
  ariaLabel: PropTypes.string,
};

CloseButton.defaultProps = {
  ariaLabel: 'close',
};

export default CloseButton;
