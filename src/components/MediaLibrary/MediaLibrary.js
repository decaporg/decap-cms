import React from 'react';
import { connect } from 'react-redux';
import Dialog from 'react-toolbox/lib/dialog';
import { Button } from 'react-toolbox/lib/button';
import { closeMediaLibrary as actionCloseMediaLibrary } from '../../actions/mediaLibrary';
import styles from './MediaLibrary.css';

const MediaLibrary = props => {
  const { isVisible, closeMediaLibrary } = props;
  return (
    <Dialog
      type="fullscreen"
      active={isVisible}
      onEscKeyDown={closeMediaLibrary}
      onOverlayClick={closeMediaLibrary}
      className={styles.dialog}
    >
      <h1>Assets</h1>
      <Button label="Cancel" onClick={closeMediaLibrary} className={styles.buttonRight}/>
    </Dialog>
  );
};

const mapStateToProps = state => {
  const { mediaLibrary } = state;
  const isVisible = mediaLibrary.get('isVisible');
  return { isVisible };
}

const mapDispatchToProps = {
  closeMediaLibrary: actionCloseMediaLibrary,
};

export default connect(mapStateToProps, mapDispatchToProps)(MediaLibrary);
