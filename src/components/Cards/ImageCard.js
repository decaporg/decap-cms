import React, { PropTypes } from 'react';
import { Card } from '../UI';
import styles from './ImageCard.css';

export default function ImageCard(props) {
  const { onClick, onImageLoaded, image, text, description } = props;
  return (
    <Card onClick={onClick} className={styles.root}>
      <img
        src={image}
        onLoad={onImageLoaded}
        alt={text}
      />
      <h2>{text}</h2>
      {description && <p>{description}</p>}
    </Card>
  );
}

ImageCard.propTypes = {
  image: PropTypes.string,
  onClick: PropTypes.func,
  onImageLoaded: PropTypes.func,
  text: PropTypes.string.isRequired,
  description: PropTypes.string,
};

ImageCard.defaultProps = {
  onClick() {},
  onImageLoaded() {},
};
