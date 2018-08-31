import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from 'react-emotion';
import { List } from 'immutable';
import uuid from 'uuid/v4';
import { lengths, components, buttons } from 'netlify-cms-ui-default';

const MAX_DISPLAY_LENGTH = 50;

const ImageWrapper = styled.div`
  flex-basis: 155px;
  width: 155px;
  height: 100px;
  margin-right: 20px;
  margin-bottom: 20px;
`;

const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: ${lengths.borderRadius};
`;

const MultiImageWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const FileInfo = styled.div`
  button:not(:first-child) {
    margin-top: 12px;
  }
`;

const FileLink = styled.a`
  margin-bottom: 20px;
  font-weight: normal;
  color: inherit;

  &:hover,
  &:active,
  &:focus {
    text-decoration: underline;
  }
`;

const FileLinkList = styled.ul`
  list-style-type: none;
`;

const FileWidgetButton = styled.button`
  ${buttons.button};
  ${components.badge};
`;

const FileWidgetButtonRemove = styled.button`
  ${buttons.button};
  ${components.badgeDanger};
`;

function isMultiple(value) {
  return Array.isArray(value) || List.isList(value);
}

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
      onClearMediaControl: PropTypes.func.isRequired,
      onRemoveMediaControl: PropTypes.func.isRequired,
      classNameWrapper: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
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
      if (mediaPath && nextProps.value !== mediaPath) {
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

    componentWillUnmount() {
      this.props.onRemoveMediaControl(this.controlID);
    }

    handleChange = e => {
      const { field, onOpenMediaLibrary, value } = this.props;
      e.preventDefault();
      return onOpenMediaLibrary({
        controlID: this.controlID,
        forImage,
        privateUpload: field.get('private'),
        value,
        config: field.getIn(['options', 'media_library', 'config']),
      });
    };

    handleRemove = e => {
      e.preventDefault();
      this.props.onClearMediaControl(this.controlID);
      return this.props.onChange('');
    };

    renderFileLink = value => {
      const size = MAX_DISPLAY_LENGTH;
      if (!value || value.length <= size) {
        return value;
      }
      const text = `${value.substring(0, size / 2)}\u2026${value.substring(
        value.length - size / 2 + 1,
        value.length,
      )}`;
      return (
        <FileLink href={value} rel="noopener" target="_blank">
          {text}
        </FileLink>
      );
    };

    renderFileLinks = () => {
      const { value } = this.props;

      if (isMultiple(value)) {
        return (
          <FileLinkList>
            {value.map(val => (
              <li key={val}>{this.renderFileLink(val)}</li>
            ))}
          </FileLinkList>
        );
      }
      return this.renderFileLink(value);
    };

    renderImages = () => {
      const { getAsset, value } = this.props;
      if (isMultiple(value)) {
        return (
          <MultiImageWrapper>
            {value.map(val => (
              <ImageWrapper key={val}>
                <Image src={getAsset(val)} />
              </ImageWrapper>
            ))}
          </MultiImageWrapper>
        );
      }
      return (
        <ImageWrapper>
          <Image src={getAsset(value)} />
        </ImageWrapper>
      );
    };

    renderSelection = subject => (
      <div>
        {forImage ? this.renderImages() : null}
        <FileInfo>
          {forImage ? null : this.renderFileLinks()}
          <FileWidgetButton onClick={this.handleChange}>
            Choose different {subject}
          </FileWidgetButton>
          <FileWidgetButtonRemove onClick={this.handleRemove}>
            Remove {subject}
          </FileWidgetButtonRemove>
        </FileInfo>
      </div>
    );

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
            {value ? this.renderSelection(subject) : this.renderNoSelection(subject, article)}
          </span>
        </div>
      );
    }
  };
}
