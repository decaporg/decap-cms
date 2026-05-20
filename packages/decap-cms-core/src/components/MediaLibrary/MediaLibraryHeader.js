import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { Icon, shadows, colors, buttons } from 'decap-cms-ui-default';

const HeaderContainer = styled.div`
  @media (max-width: 499px) {
    width: 100%;
    display: flex;
    justify-content: space-between;
    flex-direction: row-reverse;
  }
`;

const CloseButton = styled.button`
  ${buttons.button};
  background-color: white;
  @media (min-width: 500px) {
    ${shadows.dropMiddle};
    position: absolute;
    margin-right: -40px;
    left: -40px;
    top: -40px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    padding: 0;
    display: flex;
    justify-content: center;
    align-items: center;
  }
`;

const LibraryTitle = styled.h1`
  font-size: 18px;
  line-height: 28px;
  @media (min-width: 500px) {
    font-size: 22px;
    line-height: 36px;
  }
  margin-bottom: 0;
  color: ${props => props.isPrivate && colors.textFieldBorder};
`;

function MediaLibraryHeader({ onClose, title, isPrivate, t }) {
  return (
    <HeaderContainer>
      <CloseButton aria-label={t('mediaLibrary.mediaLibraryModal.close')} onClick={onClose}>
        <Icon type="close" />
      </CloseButton>
      <LibraryTitle isPrivate={isPrivate}>{title}</LibraryTitle>
    </HeaderContainer>
  );
}

MediaLibraryHeader.propTypes = {
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  isPrivate: PropTypes.bool,
};

export default MediaLibraryHeader;
