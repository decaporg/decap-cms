import PropTypes from 'prop-types';
import React from 'react';
import styled from '@emotion/styled';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { translate } from 'react-polyglot';
import { Loader, lengths } from 'netlify-cms-ui-default';
import EntryListing from './EntryListing';

const PaginationMessage = styled.div`
  width: ${lengths.topCardWidth};
  padding: 16px;
  text-align: center;
`;

const NoEntriesMessage = styled(PaginationMessage)`
  margin-top: 16px;
`;

const Entries = ({
  collections,
  entries,
  isFetching,
  viewStyle,
  cursor,
  handleCursorActions,
  t,
  page,
}) => {
  const loadingMessages = [
    t('collection.entries.loadingEntries'),
    t('collection.entries.cachingEntries'),
    t('collection.entries.longerLoading'),
  ];

  if (isFetching && page === undefined) {
    return <Loader active>{loadingMessages}</Loader>;
  }

  const hasEntries = (entries && entries.size > 0) || cursor?.actions?.has('append_next');
  if (hasEntries) {
    return (
      <>
        <EntryListing
          collections={collections}
          entries={entries}
          viewStyle={viewStyle}
          cursor={cursor}
          handleCursorActions={handleCursorActions}
          page={page}
        />
        {isFetching && page !== undefined && entries.size > 0 ? (
          <PaginationMessage>{t('collection.entries.loadingEntries')}</PaginationMessage>
        ) : null}
      </>
    );
  }

  return <NoEntriesMessage>{t('collection.entries.noEntries')}</NoEntriesMessage>;
};

Entries.propTypes = {
  collections: ImmutablePropTypes.iterable.isRequired,
  entries: ImmutablePropTypes.list,
  page: PropTypes.number,
  isFetching: PropTypes.bool,
  viewStyle: PropTypes.string,
  cursor: PropTypes.any.isRequired,
  handleCursorActions: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

export default translate()(Entries);
