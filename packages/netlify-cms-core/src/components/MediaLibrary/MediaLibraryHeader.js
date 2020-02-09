import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { Icon, shadows, colors, buttons } from 'netlify-cms-ui-legacy';

const CloseButton = styled.button`
  ${buttons.button};
  ${shadows.dropMiddle};
  position: absolute;
  margin-right: -40px;
  left: -40px;
  top: -40px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: white;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const LibraryTitle = styled.h1`
  line-height: 36px;
  font-size: 22px;
  text-align: left;
  margin-bottom: 25px;
  color: ${props => props.isPrivate && colors.textFieldBorder};
`;

const MediaLibraryHeader = ({ onClose, title, isPrivate }) => (
  <div>
    <CloseButton onClick={onClose}>
      <Icon type="close" />
    </CloseButton>
    <LibraryTitle isPrivate={isPrivate}>{title}</LibraryTitle>
  </div>
);

MediaLibraryHeader.propTypes = {
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  isPrivate: PropTypes.bool,
};

export default MediaLibraryHeader;
