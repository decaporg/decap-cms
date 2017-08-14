import React from 'react';
import { connect } from 'react-redux';
import Dialog from 'react-toolbox/lib/dialog';
import { Button } from 'react-toolbox/lib/button';
import { loadMedia, closeMediaLibrary } from '../../actions/mediaLibrary';
import styles from './MediaLibrary.css';

class MediaLibrary extends React.Component {
  componentDidMount() {
    const { dispatch, closeMediaLibrary } = this.props;
    dispatch(loadMedia());
  }

  closeMediaLibrary = () => {
    return this.props.dispatch(closeMediaLibrary());
  };

  render() {
    const { isVisible, files } = this.props;
    return (
      <Dialog
        type="fullscreen"
        active={isVisible}
        onEscKeyDown={this.closeMediaLibrary}
        onOverlayClick={this.closeMediaLibrary}
        className={styles.dialog}
      >
        <h1>Assets</h1>
        <ul>{ files ? files.map(file => <li>{file.name}</li>) : null }</ul>
        <Button label="Cancel" onClick={this.closeMediaLibrary} className={styles.buttonRight}/>
      </Dialog>
    );
  }
}

export default connect(state => state.mediaLibrary.toObject())(MediaLibrary);
