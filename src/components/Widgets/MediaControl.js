import React, { PropTypes } from 'react';
import { truncateMiddle } from '../../lib/textHelper';
import AssetProxy from '../../valueObjects/AssetProxy';
import styles from './FileControl.css';

const MAX_DISPLAY_LENGTH = 50;

export default class MediaControl extends React.Component {
  handleClick = (e) => {
    const { field, onOpenMediaLibrary } = this.props;
    return onOpenMediaLibrary(field.get('name'));
  };

  renderImageName = () => {
    if (!this.props.value) return null;
    if (this.value instanceof AssetProxy) {
      return truncateMiddle(this.props.value.path, MAX_DISPLAY_LENGTH);
    } else {
      return truncateMiddle(this.props.value, MAX_DISPLAY_LENGTH);
    }
  };

  render() {
    const imageName = this.renderImageName();
    return (
      <div className={styles.imageUpload}>
        <span className={styles.message} onClick={this.handleClick}>
          {imageName ? imageName : 'Click here to select an image from the media library'}
        </span>
      </div>
    );
  }
}

MediaControl.propTypes = {
  field: PropTypes.object.isRequired,
  onAddAsset: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onRemoveAsset: PropTypes.func.isRequired,
  onOpenMediaLibrary: PropTypes.func.isRequired,
  value: PropTypes.node,
};
