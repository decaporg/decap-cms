import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from "react-immutable-proptypes";
import uuid from 'uuid/v4';
import { truncateMiddle } from 'Lib/textHelper';

const MAX_DISPLAY_LENGTH = 50;

export default function withMediaControl(forImage) {
  return class extends React.Component {
    static propTypes = {
      field: PropTypes.object.isRequired,
      getAsset: PropTypes.func.isRequired,
      mediaPaths: ImmutablePropTypes.map.isRequired,
      onAddAsset: PropTypes.func.isRequired,
      onChange: PropTypes.func.isRequired,
      onRemoveInsertedMedia: PropTypes.func.isRequired,
      onOpenMediaLibrary: PropTypes.func.isRequired,
      classNameWrapper: PropTypes.string.isRequired,
      value: PropTypes.node,
    };

    static defaultProps = {
      value: '',
    };

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
      const { mediaPaths, value, onRemoveInsertedMedia, onChange } = nextProps;
      const mediaPath = mediaPaths.get(this.controlID);
      if (mediaPath && mediaPath !== value) {
        onChange(mediaPath);
      } else if (mediaPath && mediaPath === value) {
        onRemoveInsertedMedia(this.controlID);
      }
    }

    handleChange = e => {
      const { field, onOpenMediaLibrary} = this.props;
      e.preventDefault();
      return onOpenMediaLibrary({
        controlID: this.controlID,
        forImage,
        privateUpload: field.get('private'),
      });
    };

    handleRemove = e => {
      e.preventDefault();
      return this.props.onChange('');
    };

    renderFileName = () => {
      const { value, classNameWrapper } = this.props;
      return value ? truncateMiddle(value, MAX_DISPLAY_LENGTH) : null;
    };

    render() {
      const { value, getAsset, onRemoveAsset, classNameWrapper } = this.props;
      const fileName = this.renderFileName();
      const subject = forImage ? 'image' : 'file';
      const article = forImage ? 'an' : 'a';

      return (
        <div className={`${classNameWrapper} nc-imageControl-imageUpload`}>
          <span className="nc-imageControl-message">
            {
              fileName
                ? <div className="nc-imageControl-content">
                    {
                      forImage
                        ? <div className="nc-imageControl-imageWrapper">
                            <img src={getAsset(value)}/>
                          </div>
                        : null
                    }
                    <div>
                      <span className="nc-imageControl-filename">{fileName}</span>
                      <button className="nc-imageControl-changeButton" onClick={this.handleChange}>
                        Choose different {subject}
                      </button>
                      <button className="nc-imageControl-removeButton" onClick={this.handleRemove}>
                        Remove {subject}
                      </button>
                    </div>
                  </div>
                : <button className="nc-imageControl-chooseButton" onClick={this.handleChange}>
                    Choose {article} {subject}
                  </button>
            }
          </span>
        </div>
      );
    }
  };
};
