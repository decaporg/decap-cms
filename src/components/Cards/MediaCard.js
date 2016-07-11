import React, { PropTypes } from 'react';
import { Card } from '../UI';

export default function MediaCard({ onClick, media, text }) {
  return (
    <Card onClick={onClick}>
      <img src={media} />
      <h1>{text}</h1>
    </Card>
  );
}

MediaCard.propTypes = {
  media: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired
};
