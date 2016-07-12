import React, { PropTypes } from 'react';
import { Card } from '../UI';

export default function ImageCard({ onClick, image, text }) {
  return (
    <Card onClick={onClick}>
      <img src={image} />
      <h1>{text}</h1>
    </Card>
  );
}

ImageCard.propTypes = {
  image: PropTypes.string.isRequired,

  onClick: PropTypes.func,
  text: PropTypes.string.isRequired
};

ImageCard.defaultProps = {
  onClick: function() {},
};
