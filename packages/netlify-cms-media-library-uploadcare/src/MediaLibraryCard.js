import React from 'react';
import PropTypes from 'prop-types';
import styled from 'react-emotion';
import { colors, borders, lengths } from 'netlify-cms-ui-default';

const Card = styled.div`
  width: ${props => props.width};
  height: 180px;
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
  height: 120px;
  object-fit: cover;
  border-radius: 2px 2px 0 0;
`;

const CardImagePlaceholder = CardImage.withComponent(`div`);

const CardText = styled.p`
  color: ${colors.text};
  padding: 8px;
  margin: 0;
  overflow-wrap: break-word;
  line-height: 1.3 !important;
`;

const MediaLibraryCard = ({ imageUrl, text, onClick }) => (
  <Card
    isSelected={false}
    onClick={onClick}
    width={`140px`}
    margin={`10px`}
    tabIndex="-1"
    isPrivate={false}
  >
    <div>{imageUrl ? <CardImage src={imageUrl} /> : <CardImagePlaceholder />}</div>
    <CardText>{text}</CardText>
  </Card>
);

MediaLibraryCard.propTypes = {
  isSelected: PropTypes.bool,
  imageUrl: PropTypes.string,
  text: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  width: PropTypes.string.isRequired,
  margin: PropTypes.string.isRequired,
  isPrivate: PropTypes.bool,
};

export default MediaLibraryCard;
