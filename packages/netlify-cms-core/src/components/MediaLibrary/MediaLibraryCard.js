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
      size
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
        <Icon type="folder" size="xlarge" />
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
        <input type="checkbox" onClick={onChecked} checked={isSelected} readOnly />
        {previewElement}
        <CardText>
          <ObjectName>{text}</ObjectName>
          {isViewableImage ? <ImageMeta>{type} - {readableFileSize(size)}</ImageMeta> : null}
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
