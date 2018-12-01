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
import { loadUnpublishedEntries as actionLoadUnpublishedEntries } from 'Actions/editorialWorkflow';
import { selectEntries } from 'Reducers';
import { selectCollectionEntriesCursor } from 'Reducers/cursors';
import Entries from './Entries';
import { EDITORIAL_WORKFLOW } from 'Constants/publishModes';

class EntriesCollection extends React.Component {
  static propTypes = {
    collection: ImmutablePropTypes.map.isRequired,
    publicFolder: PropTypes.string.isRequired,
    entries: ImmutablePropTypes.list,
    isFetching: PropTypes.bool.isRequired,
    viewStyle: PropTypes.string,
    cursor: PropTypes.object.isRequired,
    loadEntries: PropTypes.func.isRequired,
    traverseCollectionCursor: PropTypes.func.isRequired,
  };

  componentDidMount() {
    const {
      collection,
      entriesLoaded,
      loadEntries,
      collections,
      isEditorialWorkflow,
      loadUnpublishedEntries,
    } = this.props;

    if (collection && !entriesLoaded) {
      loadEntries(collection);
    }

    if (isEditorialWorkflow) {
      loadUnpublishedEntries(collections);
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
    const {
      collection,
      entries,
      publicFolder,
      isFetching,
      viewStyle,
      cursor,
      unpublishedChildEntry,
    } = this.props;

    return (
      <Entries
        collections={collection}
        entries={entries}
        publicFolder={publicFolder}
        isFetching={isFetching}
        collectionName={collection.get('label')}
        viewStyle={viewStyle}
        cursor={cursor}
        unpublishedChildEntry={unpublishedChildEntry}
        handleCursorActions={partial(this.handleCursorActions, cursor)}
      />
    );
  }
}

function mapStateToProps(state, ownProps) {
  const { collection, viewStyle } = ownProps;
  const { config, collections } = state;
  const publicFolder = config.get('public_folder');
  const page = state.entries.getIn(['pages', collection.get('name'), 'page']);

  const entries = selectEntries(state, collection.get('name'));
  const entriesLoaded = !!state.entries.getIn(['pages', collection.get('name')]);
  const isFetching = state.entries.getIn(['pages', collection.get('name'), 'isFetching'], false);

  const rawCursor = selectCollectionEntriesCursor(state.cursors, collection.get('name'));
  const cursor = Cursor.create(rawCursor).clearData();
  const isEditorialWorkflow = state.config.get('publish_mode') === EDITORIAL_WORKFLOW;

  return {
    publicFolder,
    collection,
    page,
    entries,
    entriesLoaded,
    isFetching,
    viewStyle,
    cursor,
    collections,
    isEditorialWorkflow,
  };
}

const mapDispatchToProps = {
  loadEntries: actionLoadEntries,
  traverseCollectionCursor: actionTraverseCollectionCursor,
  loadUnpublishedEntries: actionLoadUnpublishedEntries,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(EntriesCollection);
