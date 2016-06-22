import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { Link } from 'react-router';

export default function EntryListing({ collection, entries }) {
  const name = collection.get('name');
  return <div>
    <h2>Listing entries!</h2>
    {entries.map((entry) => {
      const path = `/collections/${name}/entries/${entry.get('slug')}`;
      return <Link key={entry.get('slug')} to={path}>
        <h3>{entry.getIn(['data', 'title'])}</h3>
      </Link>;
    })}
  </div>;
}

EntryListing.propTypes = {
  collection: ImmutablePropTypes.map.isRequired,
  entries: ImmutablePropTypes.list,
};
