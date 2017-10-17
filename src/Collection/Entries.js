import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { loadEntries } from '../actions/entries';
import { showCollection } from '../actions/collections';
import { selectEntries } from '../reducers';
import { Loader } from '../components/UI';
import Sidebar from './Sidebar';
import EntryListing from '../components/EntryListing/EntryListing';

const Entries = props => {
  const { entries, isFetching } = props;
  const loadingMessages = [
    'Loading Entries',
    'Caching Entries',
    'This might take several minutes',
  ];

  if (entries) {
    return <EntryListing {...props}/>
  }

  if (isFetching) {
    return <Loader active>{loadingMessages}</Loader>;
  }

  return <div className="nc-collectionPage-noEntries">No Entries</div>;
}

Entries.propTypes = {
  collection: ImmutablePropTypes.map.isRequired,
  collections: ImmutablePropTypes.orderedMap.isRequired,
  publicFolder: PropTypes.string.isRequired,
  page: PropTypes.number,
  entries: ImmutablePropTypes.list,
};

export default Entries;
