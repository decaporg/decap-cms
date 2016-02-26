import React from 'react';
import { Link } from 'react-router';

export default class EntryListing extends React.Component {
  render() {
    const { collection, entries } = this.props;
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
}
