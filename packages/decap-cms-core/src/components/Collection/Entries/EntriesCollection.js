import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import styled from '@emotion/styled';
import { translate } from 'react-polyglot';
import { partial } from 'lodash';
import { Cursor } from 'decap-cms-lib-util';
import { colors } from 'decap-cms-ui-default';

import {
  loadEntries as actionLoadEntries,
  traverseCollectionCursor as actionTraverseCollectionCursor,
} from '../../../actions/entries';
import {
  selectEntries,
  selectEntriesLoaded,
  selectIsFetching,
  selectGroups,
} from '../../../reducers/entries';
import { selectCollectionEntriesCursor } from '../../../reducers/cursors';
import Entries from './Entries';

const GroupHeading = styled.h2`
  font-size: 22px;
  font-weight: 600;
  line-height: 37px;
  padding-inline-start: 20px;
  color: ${colors.textLead};
`;

const GroupContainer = styled.div``;

function getGroupEntries(entries, paths) {
  return entries.filter(entry => paths.has(entry.get('path')));
}

function getGroupTitle(group, t) {
  const { label, value } = group;
  if (value === undefined) {
    return t('collection.groups.other');
  }
  if (typeof value === 'boolean') {
    return value ? label : t('collection.groups.negateLabel', { label });
  }
  return `${label} ${value}`.trim();
}

function withGroups(groups, entries, EntriesToRender, t) {
  return groups.map(group => {
    const title = getGroupTitle(group, t);
    return (
      <GroupContainer key={group.id} id={group.id}>
        <GroupHeading>{title}</GroupHeading>
        <EntriesToRender entries={getGroupEntries(entries, group.paths)} />
      </GroupContainer>
    );
  });
}

export class EntriesCollection extends React.Component {
  static propTypes = {
    collection: ImmutablePropTypes.map.isRequired,
    page: PropTypes.number,
    entries: ImmutablePropTypes.list,
    groups: PropTypes.array,
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
    const { collection, entries, groups, isFetching, viewStyle, cursor, page, t } = this.props;

    const EntriesToRender = ({ entries }) => {
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
    };

    if (groups && groups.length > 0) {
      return withGroups(groups, entries, EntriesToRender, t);
    }

    return <EntriesToRender entries={entries} />;
  }
}

export function filterNestedEntries(path, collectionFolder, entries, subfolders) {
  const filtered = entries.filter(e => {
    let entryPath = e.get('path').slice(collectionFolder.length + 1);
    if (!entryPath.startsWith(path)) {
      return false;
    }

    // for subdirectories, trim off the parent folder corresponding to
    // this nested collection entry
    if (path) {
      entryPath = entryPath.slice(path.length + 1);
    }

    // if subfolders legacy mode is enabled, show only immediate subfolders
    // also show index file in root folder
    if (subfolders) {
      const depth = entryPath.split('/').length;
      return path ? depth === 2 : depth <= 2;
    }

    // only show immediate children
    return !entryPath.includes('/');
  });
  return filtered;
}

function mapStateToProps(state, ownProps) {
  const { collection, viewStyle, filterTerm } = ownProps;
  const page = state.entries.getIn(['pages', collection.get('name'), 'page']);

  let entries = selectEntries(state.entries, collection);
  const groups = selectGroups(state.entries, collection);

  if (collection.has('nested')) {
    const collectionFolder = collection.get('folder');
    entries = filterNestedEntries(
      filterTerm || '',
      collectionFolder,
      entries,
      collection.get('nested').get('subfolders') !== false,
    );
  }
  const entriesLoaded = selectEntriesLoaded(state.entries, collection.get('name'));
  const isFetching = selectIsFetching(state.entries, collection.get('name'));

  const rawCursor = selectCollectionEntriesCursor(state.cursors, collection.get('name'));
  const cursor = Cursor.create(rawCursor).clearData();

  return { collection, page, entries, groups, entriesLoaded, isFetching, viewStyle, cursor };
}

const mapDispatchToProps = {
  loadEntries: actionLoadEntries,
  traverseCollectionCursor: actionTraverseCollectionCursor,
};

const ConnectedEntriesCollection = connect(mapStateToProps, mapDispatchToProps)(EntriesCollection);

export default translate()(ConnectedEntriesCollection);
