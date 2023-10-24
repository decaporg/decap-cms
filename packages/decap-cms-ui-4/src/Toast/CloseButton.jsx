import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { IconButton } from '../Button';

const CloseBtn = styled(IconButton)`
  align-self: flex-start;
`;

CloseBtn.defaultProps = {
  icon: 'close',
};

function CloseButton({ closeToast, ariaLabel }) {
  return (
    <CloseBtn
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
