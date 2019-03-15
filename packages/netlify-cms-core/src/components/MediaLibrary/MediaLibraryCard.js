import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { colors, borders, lengths, shadows, effects } from 'netlify-cms-ui-default';

const IMAGE_HEIGHT = 160;

const Card = styled.div`
  width: ${props => props.width};
  height: 240px;
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
`;

const CardImage = styled.img`
  width: 100%;
  height: ${IMAGE_HEIGHT}px;
  object-fit: contain;
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

const CardText = styled.p`
  color: ${colors.text};
  padding: 8px;
  margin-top: 20px;
  overflow-wrap: break-word;
  line-height: 1.3 !important;
`;

class MediaLibraryCard extends React.Component {
  render() {
    const { isSelected, displayURL, text, onClick, width, margin, isPrivate, type } = this.props;
    const url = displayURL.get('url');
    return (
      <Card
        isSelected={isSelected}
        onClick={onClick}
        width={width}
        margin={margin}
        tabIndex="-1"
        isPrivate={isPrivate}
      >
        <CardImageWrapper>
          {url ? <CardImage src={url} /> : <CardFileIcon>{type}</CardFileIcon>}
        </CardImageWrapper>
        <CardText>{text}</CardText>
      </Card>
    );
  }
  componentDidMount() {
    const { displayURL, loadDisplayURL } = this.props;
    if (!displayURL.get('url')) {
      loadDisplayURL();
    }
  }
}

MediaLibraryCard.propTypes = {
  isSelected: PropTypes.bool,
  displayURL: ImmutablePropTypes.map.isRequired,
  text: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  width: PropTypes.string.isRequired,
  margin: PropTypes.string.isRequired,
  isPrivate: PropTypes.bool,
  type: PropTypes.string,
};

export default MediaLibraryCard;
