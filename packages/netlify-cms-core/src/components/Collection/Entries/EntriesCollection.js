import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import { partial } from 'lodash';
import { Cursor } from 'netlify-cms-lib-util';
import {
  loadEntries as actionLoadEntries,
  traverseCollectionCursor as actionTraverseCollectionCursor,
} from 'Actions/entries';
import { selectEntries, selectEntriesLoaded, selectIsFetching } from '../../../reducers/entries';
import { selectCollectionEntriesCursor } from 'Reducers/cursors';
import Entries from './Entries';

class EntriesCollection extends React.Component {
  static propTypes = {
    collection: ImmutablePropTypes.map.isRequired,
    page: PropTypes.number,
    entries: ImmutablePropTypes.list,
    isFetching: PropTypes.bool.isRequired,
    viewStyle: PropTypes.string,
    cursor: PropTypes.object.isRequired,
    loadEntries: PropTypes.func.isRequired,
    traverseCollectionCursor: PropTypes.func.isRequired,
    entriesLoaded: PropTypes.bool,
  };

  componentDidMount() {
    const { collection, entriesLoaded, loadEntries } = this.props;
    if (collection && !entriesLoaded) {
      loadEntries(collection);
    }
  }

  componentDidUpdate(prevProps) {
    const { collection, entriesLoaded, loadEntries } = this.props;
    if (collection !== prevProps.collection && !entriesLoaded) {
      loadEntries(collection);
    }
  }

  handleCursorActions = (cursor, action) => {
    const { collection, traverseCollectionCursor } = this.props;
    traverseCollectionCursor(collection, action);
  };

  render() {
    const { collection, entries, isFetching, viewStyle, cursor, page } = this.props;

    return (
      <Entries
        collections={collection}
        entries={entries}
        isFetching={isFetching}
        collectionName={collection.get('label')}
        viewStyle={viewStyle}
        cursor={cursor}
        handleCursorActions={partial(this.handleCursorActions, cursor)}
        page={page}
      />
    );
  }
}

function mapStateToProps(state, ownProps) {
  const { collection, viewStyle } = ownProps;
  const page = state.entries.getIn(['pages', collection.get('name'), 'page']);

  const entries = selectEntries(state.entries, collection.get('name'));
  const entriesLoaded = selectEntriesLoaded(state.entries, collection.get('name'));
  const isFetching = selectIsFetching(state.entries, collection.get('name'));

  const rawCursor = selectCollectionEntriesCursor(state.cursors, collection.get('name'));
  const cursor = Cursor.create(rawCursor).clearData();

  return { collection, page, entries, entriesLoaded, isFetching, viewStyle, cursor };
}

const mapDispatchToProps = {
  loadEntries: actionLoadEntries,
  traverseCollectionCursor: actionTraverseCollectionCursor,
};

export default connect(mapStateToProps, mapDispatchToProps)(EntriesCollection);
