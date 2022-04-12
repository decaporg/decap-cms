import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { css } from '@emotion/core';
import { Map, List } from 'immutable';
import { once } from 'lodash';
import uuid from 'uuid/v4';
import { oneLine } from 'common-tags';
import {
  lengths,
  components,
  buttons,
  borders,
  effects,
  shadows,
  IconButton,
} from 'netlify-cms-ui-default';
import { basename } from 'netlify-cms-lib-util';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { arrayMoveImmutable as arrayMove } from 'array-move';

const MAX_DISPLAY_LENGTH = 50;

const ImageWrapper = styled.div`
  flex-basis: 155px;
  width: 155px;
  height: 100px;
  margin-right: 20px;
  margin-bottom: 20px;
  border: ${borders.textField};
  border-radius: ${lengths.borderRadius};
  overflow: hidden;
  ${effects.checkerboard};
  ${shadows.inset};
  cursor: ${props => (props.sortable ? 'pointer' : 'auto')};
`;

const SortableImageButtonsWrapper = styled.div`
  display: flex;
  justify-content: center;
  column-gap: 10px;
  margin-right: 20px;
  margin-top: -10px;
  margin-bottom: 10px;
`;

const StyledImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

function Image(props) {
  return <StyledImage role="presentation" {...props} />;
}

function SortableImageButtons({ onRemove, onReplace }) {
  return (
    <SortableImageButtonsWrapper>
      <IconButton size="small" type="media" onClick={onReplace}></IconButton>
      <IconButton size="small" type="close" onClick={onRemove}></IconButton>
    </SortableImageButtonsWrapper>
  );
}

const SortableImage = SortableElement(({ itemValue, getAsset, field, onRemove, onReplace }) => {
  return (
    <div>
      <ImageWrapper sortable>
        <Image src={getAsset(itemValue, field) || ''} />
      </ImageWrapper>
      <SortableImageButtons
        item={itemValue}
        onRemove={onRemove}
        onReplace={onReplace}
      ></SortableImageButtons>
    </div>
  );
});

const SortableMultiImageWrapper = SortableContainer(
  ({ items, getAsset, field, onRemoveOne, onReplaceOne }) => {
    return (
      <div
        css={css`
          display: flex;
          flex-wrap: wrap;
        `}
      >
        {items.map((itemValue, index) => (
          <SortableImage
            key={`item-${itemValue}`}
            index={index}
            itemValue={itemValue}
            getAsset={getAsset}
            field={field}
            onRemove={onRemoveOne(index)}
            onReplace={onReplaceOne(index)}
          />
        ))}
      </div>
    );
  },
);

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

const FileLinks = styled.div`
  margin-bottom: 12px;
`;

const FileLinkList = styled.ul`
  list-style-type: none;
`;

const FileWidgetButton = styled.button`
  ${buttons.button};
  ${components.badge};
  margin-bottom: 12px;
`;

const FileWidgetButtonRemove = styled.button`
  ${buttons.button};
  ${components.badgeDanger};
`;

function isMultiple(value) {
  return Array.isArray(value) || List.isList(value);
}

function sizeOfValue(value) {
  if (Array.isArray(value)) {
    return value.length;
  }

  if (List.isList(value)) {
    return value.size;
  }

  return value ? 1 : 0;
}

function valueListToArray(value) {
  return List.isList(value) ? value.toArray() : value;
}

const warnDeprecatedOptions = once(field =>
  console.warn(oneLine`
  Netlify CMS config: ${field.get('name')} field: property "options" has been deprecated for the
  ${field.get('widget')} widget and will be removed in the next major release. Rather than
  \`field.options.media_library\`, apply media library options for this widget under
  \`field.media_library\`.
`),
);

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
      value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string),
        ImmutablePropTypes.listOf(PropTypes.string),
      ]),
      t: PropTypes.func.isRequired,
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
       * Always update if the value or getAsset changes.
       */
      if (this.props.value !== nextProps.value || this.props.getAsset !== nextProps.getAsset) {
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
      const mediaLibraryFieldOptions = this.getMediaLibraryFieldOptions();

      return onOpenMediaLibrary({
        controlID: this.controlID,
        forImage,
        privateUpload: field.get('private'),
        value: valueListToArray(value),
        allowMultiple: !!mediaLibraryFieldOptions.get('allow_multiple', true),
        config: mediaLibraryFieldOptions.get('config'),
        field,
      });
    };

    handleUrl = subject => e => {
      e.preventDefault();

      const url = window.prompt(this.props.t(`editor.editorWidgets.${subject}.promptUrl`));

      return this.props.onChange(url);
    };

    handleRemove = e => {
      e.preventDefault();
      this.props.onClearMediaControl(this.controlID);
      return this.props.onChange('');
    };

    onRemoveOne = index => () => {
      const { value } = this.props;
      value.splice(index, 1);
      return this.props.onChange(sizeOfValue(value) > 0 ? [...value] : null);
    };

    onReplaceOne = index => () => {
      const { field, onOpenMediaLibrary, value } = this.props;
      const mediaLibraryFieldOptions = this.getMediaLibraryFieldOptions();

      return onOpenMediaLibrary({
        controlID: this.controlID,
        forImage,
        privateUpload: field.get('private'),
        value: valueListToArray(value),
        replaceIndex: index,
        allowMultiple: false,
        config: mediaLibraryFieldOptions.get('config'),
        field,
      });
    };

    getMediaLibraryFieldOptions = () => {
      const { field } = this.props;

      if (field.hasIn(['options', 'media_library'])) {
        warnDeprecatedOptions(field);
        return field.getIn(['options', 'media_library'], Map());
      }

      return field.get('media_library', Map());
    };

    allowsMultiple = () => {
      const mediaLibraryFieldOptions = this.getMediaLibraryFieldOptions();
      return (
        mediaLibraryFieldOptions.get('config', false) &&
        mediaLibraryFieldOptions.get('config').get('multiple', false)
      );
    };

    onSortEnd = ({ oldIndex, newIndex }) => {
      const { value } = this.props;
      const newValue = arrayMove(value, oldIndex, newIndex);
      return this.props.onChange(newValue);
    };

    getValidateValue = () => {
      const { value } = this.props;
      if (value) {
        return isMultiple(value) ? value.map(v => basename(v)) : basename(value);
      }

      return value;
    };

    renderFileLink = value => {
      const size = MAX_DISPLAY_LENGTH;
      if (!value || value.length <= size) {
        return value;
      }
      const text = `${value.slice(0, size / 2)}\u2026${value.slice(-(size / 2) + 1)}`;
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
          <FileLinks>
            <FileLinkList>
              {value.map(val => (
                <li key={val}>{this.renderFileLink(val)}</li>
              ))}
            </FileLinkList>
          </FileLinks>
        );
      }
      return <FileLinks>{this.renderFileLink(value)}</FileLinks>;
    };

    renderImages = () => {
      const { getAsset, value, field } = this.props;

      if (isMultiple(value)) {
        return (
          <SortableMultiImageWrapper
            items={value}
            onSortEnd={this.onSortEnd}
            onRemoveOne={this.onRemoveOne}
            onReplaceOne={this.onReplaceOne}
            distance={4}
            getAsset={getAsset}
            field={field}
            axis="xy"
            lockToContainerEdges={true}
          ></SortableMultiImageWrapper>
        );
      }

      const src = getAsset(value, field);
      return (
        <ImageWrapper>
          <Image src={src || ''} />
        </ImageWrapper>
      );
    };

    renderSelection = subject => {
      const { t, field } = this.props;
      const allowsMultiple = this.allowsMultiple();
      return (
        <div>
          {forImage ? this.renderImages() : null}
          <div>
            {forImage ? null : this.renderFileLinks()}
            <FileWidgetButton onClick={this.handleChange}>
              {t(
                `editor.editorWidgets.${subject}.${
                  this.allowsMultiple() ? 'addMore' : 'chooseDifferent'
                }`,
              )}
            </FileWidgetButton>
            {field.get('choose_url', true) && !this.allowsMultiple() ? (
              <FileWidgetButton onClick={this.handleUrl(subject)}>
                {t(`editor.editorWidgets.${subject}.replaceUrl`)}
              </FileWidgetButton>
            ) : null}
            <FileWidgetButtonRemove onClick={this.handleRemove}>
              {t(`editor.editorWidgets.${subject}.remove${allowsMultiple ? 'All' : ''}`)}
            </FileWidgetButtonRemove>
          </div>
        </div>
      );
    };

    renderNoSelection = subject => {
      const { t, field } = this.props;
      return (
        <>
          <FileWidgetButton onClick={this.handleChange}>
            {t(`editor.editorWidgets.${subject}.choose${this.allowsMultiple() ? 'Multiple' : ''}`)}
          </FileWidgetButton>
          {field.get('choose_url', true) ? (
            <FileWidgetButton onClick={this.handleUrl(subject)}>
              {t(`editor.editorWidgets.${subject}.chooseUrl`)}
            </FileWidgetButton>
          ) : null}
        </>
      );
    };

    render() {
      const { value, classNameWrapper } = this.props;
      const subject = forImage ? 'image' : 'file';

      return (
        <div className={classNameWrapper}>
          <span>{value ? this.renderSelection(subject) : this.renderNoSelection(subject)}</span>
        </div>
      );
    }
  };
}
