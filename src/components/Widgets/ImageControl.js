import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from "react-immutable-proptypes";
import uuid from 'uuid/v4';
import { truncateMiddle } from '../../lib/textHelper';
import AssetProxy, { createAssetProxy } from '../../valueObjects/AssetProxy';

const MAX_DISPLAY_LENGTH = 50;

export default class ImageControl extends React.Component {
  constructor(props) {
    super(props);
    this.controlID = uuid();
  }

  shouldComponentUpdate(nextProps) {
    /**
     * Always update if the value changes.
     */
    if (this.props.value !== nextProps.value) {
      return true;
    }

    /**
     * If there is a media path for this control in the state object, and that
     * path is different than the value in `nextProps`, update.
     */
    const mediaPath = nextProps.mediaPaths.get(this.controlID);
    if (mediaPath && (nextProps.value !== mediaPath)) {
      return true;
    }

    return false;
  }

  componentWillReceiveProps(nextProps) {
    const { mediaPaths, value } = nextProps;
    const mediaPath = mediaPaths.get(this.controlID);
    if (mediaPath && mediaPath !== value) {
      this.props.onChange(mediaPath);
    }
  }

  handleChange = (e) => {
    const { field, onOpenMediaLibrary } = this.props;
    return onOpenMediaLibrary({ controlID: this.controlID, forImage: true, privateUpload: field.get('private') });
  };


  handleRemove = (e) => {
    return this.props.onChange('');
  };

  renderFileName = () => {
    const { value } = this.props;
    return value ? truncateMiddle(value, MAX_DISPLAY_LENGTH) : null;
  };

  render() {
    const { value, getAsset } = this.props;
    const fileName = this.renderFileName();
    return (
      <div className="nc-imageControl-imageUpload">
        <span className="nc-imageControl-message">
          {
            fileName
              ? <div className="nc-imageControl-content">
                  <div className="nc-imageControl-imageWrapper">
                    <img src={getAsset(value)}/>
                  </div>
                  <div className="nc-imageControl-details">
                    <span className="nc-imageControl-filename">{fileName}</span>
                    <button className="nc-imageControl-changeButton" onClick={this.handleChange}>
                      Choose different image
                    </button>
                    <button className="nc-imageControl-removeButton" onClick={this.handleRemove}>
                      Remove image
                    </button>
                  </div>
                </div>
              : <button className="nc-imageControl-changeButton" onClick={this.handleChange}>
                  Choose an image
                </button>
          }
        </span>
      </div>
    );
  }
}

ImageControl.propTypes = {
  field: PropTypes.object.isRequired,
  getAsset: PropTypes.func.isRequired,
  mediaPaths: ImmutablePropTypes.map.isRequired,
  onAddAsset: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onRemoveAsset: PropTypes.func.isRequired,
  onOpenMediaLibrary: PropTypes.func.isRequired,
  value: PropTypes.node,
};
