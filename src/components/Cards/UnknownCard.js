import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { Card } from '../UI';

export default function UnknownCard({ collection }) {
  return (
    <Card>
      <p>No card of type “{collection.getIn(['card', 'type'])}”.</p>
    </Card>
  );
}

UnknownCard.propTypes = {
  collection: ImmutablePropTypes.map,
};
