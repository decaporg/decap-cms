import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { translate } from 'react-polyglot';
import { connect } from 'react-redux';
import { Dialog } from 'decap-cms-ui-next';

import { closeMediaLibrary as closeMediaLibraryAction } from '../../actions/mediaLibrary';
import MediaLibrary from './MediaLibrary';

const MediaDialogWrap = styled(Dialog)`
  color: ${({ theme }) => theme.color.text};
  height: 80%;
  max-height: 100%;
  max-width: 100%;
  display: flex;
  overflow: hidden;
  width: 75vw;
  height: 75vh;
  ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
    height: 100%;
  }
`;

function MediaDialog({ isVisible, closeMediaLibrary }) {
  function handleClose() {
    closeMediaLibrary();
  }

  return (
    <MediaDialogWrap open={isVisible} onClose={handleClose}>
      <MediaLibrary isDialog />
    </MediaDialogWrap>
  );
}

MediaDialog.propTypes = {
  isVisible: PropTypes.bool,
  closeMediaLibrary: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
  const { mediaLibrary } = state;
  const mediaLibraryProps = {
    isVisible: mediaLibrary.get('isVisible'),
  };

  return { ...mediaLibraryProps };
}

const mapDispatchToProps = {
  handleClose: () => closeMediaLibraryAction,
};

export default connect(mapStateToProps, mapDispatchToProps)(translate()(MediaDialog));
