import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import IconButton from '../IconButton';

const CloseBtn = styled(IconButton).attrs({ name: 'close' })`
  align-self: flex-start;
`;

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
