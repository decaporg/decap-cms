import React from 'react';
import PropTypes from 'prop-types';
import styled from 'react-emotion';
import { colors, borders, lengths } from 'netlify-cms-ui-default';

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

const CardImage = styled.img`
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 2px 2px 0 0;
`;

const CardImagePlaceholder = CardImage.withComponent(`div`);

const CardText = styled.p`
  color: ${colors.text};
  padding: 8px;
  margin-top: 20px;
  overflow-wrap: break-word;
  line-height: 1.3 !important;
`;

const MediaLibraryCard = ({ isSelected, displayURL, text, onClick, width, margin, isPrivate }) => (
  <Card
    isSelected={isSelected}
    onClick={onClick}
    width={width}
    margin={margin}
    tabIndex="-1"
    isPrivate={isPrivate}
  >
    <div>{displayURL ? <CardImage src={displayURL} /> : <CardImagePlaceholder />}</div>
    <CardText>{text}</CardText>
  </Card>
);

MediaLibraryCard.propTypes = {
  isSelected: PropTypes.bool,
  displayURL: PropTypes.string,
  text: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  width: PropTypes.string.isRequired,
  margin: PropTypes.string.isRequired,
  isPrivate: PropTypes.bool,
};

export default MediaLibraryCard;
