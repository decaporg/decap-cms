import React, { PropTypes } from 'react';
import { Card } from '../UI';

export default function AlltypeCard({ onClick, text }) {
  return (
    <Card onClick={onClick}>
      <p>{text}</p>
    </Card>
  );
}

AlltypeCard.propTypes = {
  text: PropTypes.string.isRequired
};
