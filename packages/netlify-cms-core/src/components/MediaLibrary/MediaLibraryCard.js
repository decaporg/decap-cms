import React from 'react';
import PropTypes from 'prop-types';
import styled from 'react-emotion';
import { colors, borders, lengths } from 'netlify-cms-ui-default';
import MediaLibraryCardImage from './MediaLibraryCardImage';

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

const CardText = styled.p`
  color: ${colors.text};
  padding: 8px;
  margin-top: 20px;
  overflow-wrap: break-word;
  line-height: 1.3 !important;
`;

const MediaLibraryCard = ({ isSelected, image, text, onClick, width, margin, isPrivate }) => (
  <Card
    isSelected={isSelected}
    onClick={onClick}
    width={width}
    margin={margin}
    tabIndex="-1"
    isPrivate={isPrivate}
  >
    <div>
      <MediaLibraryCardImage
        image={image}
        getCachedImageURLByID={id => this.imageURLsByIDs.get(id)}
        cacheImageURLByID={(id, url) => {
          this.imageURLsByIDs = this.imageURLsByIDs.set(id, url);
        }}
        isVisible
      />
    </div>
    <CardText>{text}</CardText>
  </Card>
);

MediaLibraryCard.propTypes = {
  isSelected: PropTypes.bool,
  image: PropTypes.object,
  text: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  width: PropTypes.string.isRequired,
  margin: PropTypes.string.isRequired,
  isPrivate: PropTypes.bool,
};

export default MediaLibraryCard;
