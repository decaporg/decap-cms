import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import { loadEntries } from '../actions/entries';
import { showCollection } from '../actions/collections';
import { selectEntries } from '../reducers';
import { Loader } from '../components/UI';
import Sidebar from './Sidebar';
import Top from './Top';
import Entries from './Entries';
import EntryListing from '../components/EntryListing/EntryListing';

class Collection extends React.Component {

  static propTypes = {
    collection: ImmutablePropTypes.map.isRequired,
    collections: ImmutablePropTypes.orderedMap.isRequired,
    publicFolder: PropTypes.string.isRequired,
    dispatch: PropTypes.func.isRequired,
    page: PropTypes.number,
    entries: ImmutablePropTypes.list,
    isFetching: PropTypes.bool.isRequired,
  };

  state = { query: '' };

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
    const { query } = this.state;

    return (
      <div className="nc-collectionPage-container">
        <Sidebar collections={collections}/>
        <Top collectionName={collection.get('label')}/>
        <Entries
          collections={collection}
          entries={entries}
          publicFolder={publicFolder}
          page={page}
          onPaginate={this.handleLoadMore}
          isFetching={isFetching}
          collectionName={collection.get('label')}
        />
      </div>
    );
  }
}


function mapStateToProps(state, ownProps) {
  const { collections, config } = state;
  const { name } = ownProps.match.params;
  const publicFolder = config.get('public_folder');
  const collection = name ? collections.get(name) : collections.first();
  const page = state.entries.getIn(['pages', collection.get('name'), 'page']);

  const entries = selectEntries(state, collection.get('name'));
  const isFetching = state.entries.getIn(['pages', collection.get('name'), 'isFetching'], false);

  return { publicFolder, collection, collections, page, entries, isFetching };
}

export default connect(mapStateToProps)(Collection);
