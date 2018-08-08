import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { Loader } from 'netlify-cms-ui-default';
import EntryListing from './EntryListing';

const Entries = ({
  collections,
  entries,
  publicFolder,
  isFetching,
  viewStyle,
  cursor,
  handleCursorActions,
}) => {
  const loadingMessages = ['Loading Entries', 'Caching Entries', 'This might take several minutes'];

  if (entries) {
    return (
      <EntryListing
        collections={collections}
        entries={entries}
        publicFolder={publicFolder}
        viewStyle={viewStyle}
        cursor={cursor}
        handleCursorActions={handleCursorActions}
      />
    );
  }

  if (isFetching) {
    return <Loader active>{loadingMessages}</Loader>;
  }

  return <div className="nc-collectionPage-noEntries">No Entries</div>;
};

Entries.propTypes = {
  collections: ImmutablePropTypes.map.isRequired,
  entries: ImmutablePropTypes.list,
  publicFolder: PropTypes.string.isRequired,
  page: PropTypes.number,
  isFetching: PropTypes.bool,
  viewStyle: PropTypes.string,
  cursor: PropTypes.any.isRequired,
  handleCursorActions: PropTypes.func.isRequired,
};

export default Entries;
