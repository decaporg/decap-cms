import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { Icon, IconButton } from 'decap-cms-ui-next';

const MediaTitlebarWrap = styled.div`
  position: relative;
  display: flex;
  align-items: 'center';
  justify-content: space-between;
`;

const MediaTitle = styled.h1`
  font-weight: bold;
  color: ${({ isPrivate, theme }) => (isPrivate ? theme.color.danger[900] : null)};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

function MediaTitlebar({ onClose, title, isPrivate, isDialog }) {
  return (
    <MediaTitlebarWrap isDialog={isDialog}>
      <MediaTitle isPrivate={isPrivate}>
        {!isDialog && <Icon size="lg" name="image" />}
        {title}
      </MediaTitle>

      {isDialog && <IconButton icon="cross" onClick={onClose} />}
    </MediaTitlebarWrap>
  );
}

MediaTitlebar.propTypes = {
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  isPrivate: PropTypes.bool,
};

export default MediaTitlebar;
