import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import pick from 'lodash/pick';
import {
  loadEntries as actionLoadEntries,
  traverseCollectionCursor as actionTraverseCollectionCursor,
} from 'Actions/entries';
import { selectEntries } from 'Reducers';
import { collectionEntriesCursorKey } from 'Reducers/cursors';
import Entries from './Entries';

class EntriesCollection extends React.Component {
  static propTypes = {
    collection: ImmutablePropTypes.map.isRequired,
    publicFolder: PropTypes.string.isRequired,
    page: PropTypes.number,
    entries: ImmutablePropTypes.list,
    isFetching: PropTypes.bool.isRequired,
    viewStyle: PropTypes.string,
  };

  componentDidMount() {
    const { collection, loadEntries } = this.props;
    if (collection) {
      loadEntries(collection);
    }
  }

  componentWillReceiveProps(nextProps) {
    const { collection, loadEntries } = this.props;
    if (nextProps.collection !== collection) {
      loadEntries(nextProps.collection);
    }
  }

  handleLoadMore = page => {
    const { collection, loadEntries } = this.props;
    loadEntries(collection, page);
  }

  cursorHandler = action => () => {
    const { collection, traverseCollectionCursor } = this.props;
    traverseCollectionCursor(collection, action);
  };

  getCursorActionFunctions = (cursor, handler) => cursor && cursor.actions
    ? cursor.actions.reduce((acc, action) => ({ ...acc, [action]: handler(action) }), {})
    : {};

  render () {
    const { collection, entries, publicFolder, page, isFetching, viewStyle, cursor } = this.props;

    return (
      <Entries
        collections={collection}
        entries={entries}
        publicFolder={publicFolder}
        page={page}
        onPaginate={this.handleLoadMore}
        isFetching={isFetching}
        collectionName={collection.get('label')}
        viewStyle={viewStyle}
        cursorActions={this.getCursorActionFunctions(cursor, this.cursorHandler)}
        cursorMeta={cursor && cursor.meta}
      />
    );
  }
}

function mapStateToProps(state, ownProps) {
  const { name, collection, viewStyle } = ownProps;
  const { config } = state;
  const publicFolder = config.get('public_folder');
  const page = state.entries.getIn(['pages', collection.get('name'), 'page']);

  const entries = selectEntries(state, collection.get('name'));
  const isFetching = state.entries.getIn(['pages', collection.get('name'), 'isFetching'], false);

  const rawCursor = state.cursors.get(collectionEntriesCursorKey(collection.get('name')));
  const cursor = rawCursor && pick(rawCursor, ["meta", "actions"]);

  return { publicFolder, collection, page, entries, isFetching, viewStyle, cursor };
}

const mapDispatchToProps = {
  loadEntries: actionLoadEntries,
  traverseCollectionCursor: actionTraverseCollectionCursor,
};

export default connect(mapStateToProps, mapDispatchToProps)(EntriesCollection);
