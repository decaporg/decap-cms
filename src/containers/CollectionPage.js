import React, { PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import { loadEntries } from '../actions/entries';
import { selectEntries } from '../reducers';
import { Loader } from '../components/UI';
import EntryListing from '../components/EntryListing';
import styles from './CollectionPage.css';
import CollectionPageHOC from './editorialWorkflow/CollectionPageHOC';

class DashboardPage extends React.Component {

  static propTypes = {
    collection: ImmutablePropTypes.map.isRequired,
    collections: ImmutablePropTypes.orderedMap.isRequired,
    dispatch: PropTypes.func.isRequired,
    page: PropTypes.number,
    entries: ImmutablePropTypes.list,
  };

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

  handleLoadMore = (page) => {
    const { collection, dispatch } = this.props;
    dispatch(loadEntries(collection, page));
  };

  render() {
    const { collections, collection, page, entries } = this.props;
    if (collections == null) {
      return <h1>No collections defined in your config.yml</h1>;
    }
    return (<div className={styles.root}>
      {entries ?
        <EntryListing
          collections={collection}
          entries={entries}
          page={page}
          onPaginate={this.handleLoadMore}
        >
          {collection.get('label')}
        </EntryListing>
        :
          <Loader active>{['Loading Entries', 'Caching Entries', 'This might take several minutes']}</Loader>
      }
    </div>);
  }
}

/*
 * Instead of checking the publish mode everywhere to dispatch & render the additional editorial workflow stuff,
 * We delegate it to a Higher Order Component
 */
DashboardPage = CollectionPageHOC(DashboardPage); // eslint-disable-line


function mapStateToProps(state, ownProps) {
  const { collections } = state;
  const { name, slug } = ownProps.params;
  const collection = name ? collections.get(name) : collections.first();
  const page = state.entries.getIn(['pages', collection.get('name'), 'page']);

  const entries = selectEntries(state, collection.get('name'));

  return { slug, collection, collections, page, entries };
}

export default connect(mapStateToProps)(DashboardPage);
