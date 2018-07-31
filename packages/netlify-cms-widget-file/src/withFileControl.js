import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from 'react-emotion';
import uuid from 'uuid/v4';
import { lengths, components, buttons } from 'netlify-cms-ui-default';

const MAX_DISPLAY_LENGTH = 50;

const FileContent = styled.div`
  display: flex;
`

const ImageWrapper = styled.div`
  width: 155px;
  height: 100px;
  margin-right: 20px;
`

const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: ${lengths.borderRadius};
`

const FileInfo = styled.div`
  button:not(:first-child) {
    margin-top: 12px;
  }
`

const FileName = styled.span`
  display: block;
  font-size: 16px;
  margin-bottom: 20px;
`

const FileWidgetButton = styled.button`
  ${buttons.button};
  ${components.textBadge};
  display: block;
`

const FileWidgetButtonRemove = styled.button`
  ${buttons.button};
  ${components.textBadgeDanger};
  display: block;
`

export default function withFileControl({ forImage } = {}) {
  return class FileControl extends React.Component {
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

    componentDidUpdate() {
      const { mediaPaths, value, onRemoveInsertedMedia, onChange } = this.props;
      const mediaPath = mediaPaths.get(this.controlID);
      if (mediaPath && mediaPath !== value) {
        onChange(mediaPath);
      } else if (mediaPath && mediaPath === value) {
        onRemoveInsertedMedia(this.controlID);
      }
    }

    handleChange = e => {
      const { field, onOpenMediaLibrary } = this.props;
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
      const size = MAX_DISPLAY_LENGTH;
      if (!value || value.length <= size) {
        return value;
      }
      return `${ value.substring(0, size / 2) }\u2026${ value.substring(value.length - size / 2 + 1, value.length) }`;
    };

    renderSelection = (subject) => {
      const fileName = this.renderFileName();
      const { getAsset, value } = this.props;
      return (
        <FileContent>
          { forImage ? <ImageWrapper><Image src={getAsset(value)}/></ImageWrapper> : null }
          <FileInfo>
            <FileName>{fileName}</FileName>
            <FileWidgetButton onClick={this.handleChange}>
              Choose different {subject}
            </FileWidgetButton>
            <FileWidgetButtonRemove onClick={this.handleRemove}>
              Remove {subject}
            </FileWidgetButtonRemove>
          </FileInfo>
        </FileContent>
      );
    };

    renderNoSelection = (subject, article) => (
      <FileWidgetButton onClick={this.handleChange}>
        Choose {article} {subject}
      </FileWidgetButton>
    );

    render() {
      const { value, classNameWrapper } = this.props;
      const subject = forImage ? 'image' : 'file';
      const article = forImage ? 'an' : 'a';

      return (
        <div className={classNameWrapper}>
          <span>
            { value ? this.renderSelection(subject) : this.renderNoSelection(subject, article) }
          </span>
        </div>
      );
    }
  }
}
