import React, { PropTypes } from 'react';
import { Card, CardMedia, CardTitle, CardText } from 'react-toolbox/lib/card';
import styles from './ImageCard.css';

const ImageCard = (
  {
    author,
    description,
    image,
    text,
    onClick,
    onImageLoaded,
  }) => (
    <Card
      onClick={onClick}
      className={styles.root}
    >
      <CardTitle
        title={text}
      />
      {
      image && <CardMedia aspectRatio="wide">
        <img
          src={image}
          alt={text}
          onLoad={onImageLoaded}
        />
      </CardMedia>
    }
      { description && <CardText>{ description }</CardText> }
    </Card>
);

ImageCard.propTypes = {
  image: PropTypes.string,
  onClick: PropTypes.func,
  onImageLoaded: PropTypes.func,
  text: PropTypes.string.isRequired,
  description: PropTypes.string,
};

ImageCard.defaultProps = {
  onClick: () => {
  },
  onImageLoaded: () => {
  },
};

export default ImageCard;
