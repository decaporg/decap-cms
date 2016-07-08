import React, { PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { loadEntries } from '../actions/entries';
import { selectEntries } from '../reducers';
import EntryListing from '../components/EntryListing';

class DashboardPage extends React.Component {
  componentDidMount() {
    const { collection, dispatch } = this.props;

    if (collection) {
      dispatch(loadEntries(collection));
    }
  }

  componentWillReceiveProps(nextProps) {
    const { collection, dispatch } = this.props;
    if (nextProps.collection !== collection) {
      dispatch(loadEntries(nextProps.collection));
    }
  }

  render() {
    const { collections, collection, entries } = this.props;
    if (collections == null) {
      return <h1>No collections defined in your config.yml</h1>;
    }

    return <div>
      <h1>Dashboard</h1>
      <div>
        {collections.map((collection) => (
          <div key={collection.get('name')}>
            <Link to={`/collections/${collection.get('name')}`}>{collection.get('name')}</Link>
          </div>
        )).toArray()}
      </div>
      <div>
        {entries ? <EntryListing collection={collection} entries={entries}/> : 'Loading entries...'}
      </div>
    </div>;
  }
}

DashboardPage.propTypes = {
  collection: ImmutablePropTypes.map.isRequired,
  collections: ImmutablePropTypes.orderedMap.isRequired,
  dispatch: PropTypes.func.isRequired,
  entries: ImmutablePropTypes.list,
};

function mapStateToProps(state, ownProps) {
  const { collections } = state;
  const { name, slug } = ownProps.params;
  const collection = name ? collections.get(name) : collections.first();
  const entries = selectEntries(state, collection.get('name'));

  return { slug, collection, collections, entries };
}

export default connect(mapStateToProps)(DashboardPage);
