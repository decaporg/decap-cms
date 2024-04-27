import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { IconButton } from 'decap-cms-ui-next';

const MediaTitlebarWrap = styled.div`
  position: relative;
  display: flex;
  justify-content: 'center';
  align-items: 'center';
  min-height: 4rem;
  padding: 1rem;
`;

const CloseButton = styled(IconButton)`
  position: absolute;
  top: 1rem;
  right: 1rem;
`;

const MediaTitle = styled.h1`
  font-weight: bold;
  color: ${({ isPrivate, theme }) => (isPrivate ? theme.color.danger[900] : null)};
`;

function MediaTitlebar({ onClose, title, isPrivate, isDialog }) {
  return (
    <MediaTitlebarWrap isDialog={isDialog}>
      <MediaTitle isPrivate={isPrivate}>{title}</MediaTitle>

      {isDialog && <CloseButton icon="cross" onClick={onClose} />}
    </MediaTitlebarWrap>
  );
}

MediaTitlebar.propTypes = {
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  isPrivate: PropTypes.bool,
};

export default MediaTitlebar;
