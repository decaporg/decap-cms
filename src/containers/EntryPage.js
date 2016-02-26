import React from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { loadEntries } from '../actions/entries';
import EntryListing from '../components/EntryListing';

class DashboardPage extends React.Component {
  componentDidMount() {
  }

  componentWillReceiveProps(nextProps) {
  }

  render() {
    const { collection, entry } = this.props;

    return <div>
      <h1>Entry in {collection.get('label')}</h1>
      <h2>{entry && entry.get('title')}</h2>
    </div>;
  }
}

function mapStateToProps(state, ownProps) {
  const { collections } = state;

  return {
    collection: collections.get(ownProps.params.name),
    collections: collections
  };
}

export default connect(mapStateToProps)(DashboardPage);
