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

export class EntriesCollection extends React.Component {
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

export const filterNestedEntries = (path, collectionFolder, entries) => {
  const filtered = entries.filter(e => {
    const entryPath = e.get('path').substring(collectionFolder.length + 1);
    if (!entryPath.startsWith(path)) {
      return false;
    }

    // only show immediate children
    if (path) {
      // non root path
      const trimmed = entryPath.substring(path.length + 1);
      return trimmed.split('/').length === 2;
    } else {
      // root path
      return entryPath.split('/').length <= 2;
    }
  });
  return filtered;
};

function mapStateToProps(state, ownProps) {
  const { collection, viewStyle, filterTerm } = ownProps;
  const page = state.entries.getIn(['pages', collection.get('name'), 'page']);

  let entries = selectEntries(state.entries, collection);

  if (collection.has('nested')) {
    const collectionFolder = collection.get('folder');
    entries = filterNestedEntries(filterTerm || '', collectionFolder, entries);
  }
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
