import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { colors, borders, lengths, shadows, effects, Icon } from 'netlify-cms-ui-default';

const IMAGE_HEIGHT = 160;

const Card = styled.div`
  width: ${props => props.width};
  height: ${props => props.height};
  margin: ${props => props.margin};
  border: ${borders.textField};
  border-color: ${props => props.isSelected && colors.active};
  border-radius: ${lengths.borderRadius};
  cursor: pointer;
  overflow: hidden;
  background-color: ${props => props.isPrivate && colors.textFieldBorder};
  position: relative;
  &:focus {
    outline: none;
  }
`;

const CardImageWrapper = styled.div`
  height: ${IMAGE_HEIGHT + 2}px;
  ${effects.checkerboard};
  ${shadows.inset};
  border-bottom: solid ${lengths.borderWidth} ${colors.textFieldBorder};
  position: relative;
`;

const CardImage = styled.img`
  width: 100%;
  height: ${IMAGE_HEIGHT}px;
  object-fit: cover;
  border-radius: 2px 2px 0 0;
`;

const CardFileIcon = styled.div`
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 2px 2px 0 0;
  padding: 1em;
  font-size: 3em;
`;

const CardDirctoryWrapper = styled.div`
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 2px 2px 0 0;
  padding: 1em;
  font-size: 3em;
  background: #eee;
`;

const CardText = styled.div`
  color: ${colors.text};
  padding: 8px;
  font-size: 0.8em;
  display: flex;
  justify-content: center;
  flex-direction: column;
`;

const ObjectName = styled.div`
  color: ${colors.text};
  font-weight: 600;
  overflow-wrap: break-word;
  line-height: 1.3 !important;
  text-align: left;
`;

const ImageMeta = styled.div`
  text-align: left;
`;

const DraftText = styled.p`
  color: ${colors.mediaDraftText};
  background-color: ${colors.mediaDraftBackground};
  position: absolute;
  padding: 8px;
  border-radius: ${lengths.borderRadius} 0px ${lengths.borderRadius} 0;
`;

const radioButtonCheckboxWidthHeight = '24px';
const inputBorderColor = '#fff';
const inputBackgroundColor = 'rgba(0, 0, 0, 0.2)';
const inputHoverBorderColor = '#33BCB0';
const radioCheckboxSelectedBackgroundColor = '#33BCB0';
const svgDataRriIconTick = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 28"  class="single-colour tick"><path fill="%23fff" d="M13 28c-0.7 0-1.3-0.2-1.9-0.7l-10-8c-1.3-1-1.5-2.9-0.5-4.2 1-1.3 2.9-1.5 4.2-0.5l7.9 6.3L32.9 0.9c1.2-1.2 3.1-1.2 4.2 0 1.2 1.2 1.2 3.1 0 4.2l-22 22C14.5 27.7 13.8 28 13 28z"/></svg>')`;
const radioCheckboxSelectedBackgroundPosition = 'center 6px';
const radioCheckboxSelectedBackgroundSize = '13px';
const inputFocusBorderColor = '#fff';

const AssetCheckbox = styled.input`
  display: inline-block;
  -webkit-appearance: none;
  -moz-appearance: none;
  position: relative;
  cursor: pointer;
  left: 0;
  top: 0;
  width: ${radioButtonCheckboxWidthHeight};
  height: ${radioButtonCheckboxWidthHeight};
  padding: 0 !important;
  background: transparent !important;
  border-width: 0 !important;
  &:after {
    border: 1px solid ${inputBorderColor};
    content: '';
    background-color: ${inputBackgroundColor};
    width: ${radioButtonCheckboxWidthHeight};
    height: ${radioButtonCheckboxWidthHeight};
    border-radius: 50%;
    position: absolute;
    top: 0;
    left: 0px;
  }
  &:hover:after {
    border-color: ${inputHoverBorderColor};
  }
  &:checked:after,
  &.checked:after {
    background: ${radioCheckboxSelectedBackgroundColor} ${svgDataRriIconTick} no-repeat
      ${radioCheckboxSelectedBackgroundPosition};
    background-size: ${radioCheckboxSelectedBackgroundSize};
  }
  &:focus:after,
  &:focus:checked:after {
    border-color: ${inputFocusBorderColor};
  }
`;

const CheckboxContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
`;

function readableFileSize(numberOfBytes) {
  let readableSize;
  let units;
  numberOfBytes = numberOfBytes || 0;
  if (numberOfBytes >= 0 && numberOfBytes < 1000) {
    readableSize = numberOfBytes;
    units = ' bytes';
  } else if (numberOfBytes >= 1000 && numberOfBytes < 1000000) {
    readableSize = Math.ceil(numberOfBytes / 1000);
    units = ' KB';
  } else if (numberOfBytes >= 1000000 && numberOfBytes < 1000000000) {
    readableSize = (numberOfBytes / 1000000).toFixed(2);
    units = ' MB';
  } else if (numberOfBytes >= 1000000000) {
    readableSize = (numberOfBytes / 1000000000).toFixed(2);
    units = ' GB';
  }
  return readableSize + units;
}

class MediaLibraryCard extends React.Component {
  render() {
    const {
      isSelected,
      displayURL,
      text,
      onClick,
      onChecked,
      draftText,
      width,
      height,
      margin,
      isPrivate,
      type,
      isViewableImage,
      isDraft,
      isDirectory,
      size,
      hasChildren,
    } = this.props;
    const url = displayURL.get('url');
    var cardImageWrapper = (
      <CardImageWrapper>
        {isDraft ? <DraftText data-testid="draft-text">{draftText}</DraftText> : null}
        {url && isViewableImage ? (
          <CardImage src={url} />
        ) : (
          <CardFileIcon data-testid="card-file-icon">{type}</CardFileIcon>
        )}
      </CardImageWrapper>
    );
    var cardDirectoryEl = (
      <CardDirctoryWrapper>
        <Icon type="folder" size="max" />
      </CardDirctoryWrapper>
    );
    var previewElement = isDirectory ? cardDirectoryEl : cardImageWrapper;
    return (
      <Card
        isSelected={isSelected}
        onClick={onClick}
        width={width}
        height={height}
        margin={margin}
        tabIndex="-1"
        isPrivate={isPrivate}
      >
        {!hasChildren ? (
          <CheckboxContainer>
            <AssetCheckbox type="checkbox" onClick={onChecked} checked={isSelected} readOnly />
          </CheckboxContainer>
        ) : null}

        {previewElement}
        <CardText>
          <ObjectName>{text}</ObjectName>
          {isViewableImage ? (
            <ImageMeta>
              {type} - {readableFileSize(size)}
            </ImageMeta>
          ) : null}
        </CardText>
      </Card>
    );
  }
  componentDidMount() {
    const { displayURL, loadDisplayURL, isViewableImage } = this.props;
    if (!displayURL.get('url') && isViewableImage) {
      loadDisplayURL();
    }
  }
}

MediaLibraryCard.propTypes = {
  isSelected: PropTypes.bool,
  displayURL: ImmutablePropTypes.map.isRequired,
  text: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  draftText: PropTypes.string.isRequired,
  width: PropTypes.string.isRequired,
  height: PropTypes.string.isRequired,
  margin: PropTypes.string.isRequired,
  isPrivate: PropTypes.bool,
  type: PropTypes.string,
  isViewableImage: PropTypes.bool.isRequired,
  loadDisplayURL: PropTypes.func.isRequired,
  isDraft: PropTypes.bool,
};

export default MediaLibraryCard;
