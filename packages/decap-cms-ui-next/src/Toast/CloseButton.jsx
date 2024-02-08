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
  return (
    <StyledCloseButton
      onClick={e => {
        e.stopPropagation();
        closeToast();
      }}
      aria-label={ariaLabel}
    />
  );
}

CloseButton.propTypes = {
  closeToast: PropTypes.func,
  arialLabel: PropTypes.string,
};

CloseButton.defaultProps = {
  ariaLabel: 'close',
};

export default CloseButton;
