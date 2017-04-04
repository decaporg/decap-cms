import React, { PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import { loadEntries } from '../actions/entries';
import { selectEntries } from '../reducers';
import { Loader } from '../components/UI';
import EntryListing from '../components/EntryListing/EntryListing';
import styles from "./CollectionPage.css";

class CollectionPage extends React.Component {

  static propTypes = {
    collection: ImmutablePropTypes.map.isRequired,
    collections: ImmutablePropTypes.orderedMap.isRequired,
    publicFolder: PropTypes.string.isRequired,
    dispatch: PropTypes.func.isRequired,
    page: PropTypes.number,
    entries: ImmutablePropTypes.list,
    isFetching: PropTypes.bool.isRequired,
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
    const { collections, collection, publicFolder, page, entries, isFetching } = this.props;
    if (collections == null) {
      return <h1>No collections defined in your config.yml</h1>;
    }

    const entriesContent = (<EntryListing
      collections={collection}
      entries={entries}
      publicFolder={publicFolder}
      page={page}
      onPaginate={this.handleLoadMore}
    >
      {collection.get('label')}
    </EntryListing>);

    const fetchingEntriesContent = (<Loader active>
        {['Loading Entries', 'Caching Entries', 'This might take several minutes']}
    </Loader>);
    const noEntriesContent = <div className={styles.noEntries}>No Entries</div>;
    const fallbackContent = isFetching ? fetchingEntriesContent : noEntriesContent;

    return (<div>{entries ? entriesContent : fallbackContent}</div>);
  }
}


function mapStateToProps(state, ownProps) {
  const { collections, config } = state;
  const { name, slug } = ownProps.params;
  const publicFolder = config.get('public_folder');
  const collection = name ? collections.get(name) : collections.first();
  const page = state.entries.getIn(['pages', collection.get('name'), 'page']);

  const entries = selectEntries(state, collection.get('name'));
  const isFetching = state.entries.getIn(['pages', collection.get('name'), 'isFetching'], false);

  return { slug, publicFolder, collection, collections, page, entries, isFetching };
}

export default connect(mapStateToProps)(CollectionPage);
