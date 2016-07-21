import React, { PropTypes } from 'react';
import { Card } from '../UI';
import styles from './ImageCard.css';

export default class ImageCard extends React.Component {

  render() {
    const { onClick, onImageLoaded, image, text, description } = this.props;
    console.log(this.props)
    return (
      <Card onClick={onClick} className={styles.root}>
        <img src={image} onLoad={onImageLoaded} />
        <h1>{text}</h1>

        {description ? <p>{description}</p> : null}
      </Card>
    );
  }
}

ImageCard.propTypes = {
  image: PropTypes.string,
  onClick: PropTypes.func,
  onImageLoaded: PropTypes.func,
  text: PropTypes.string.isRequired,
  description: PropTypes.string
};

ImageCard.defaultProps = {
  onClick: function() {},
  onImageLoaded: function() {}
};
