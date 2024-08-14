import PropTypes from 'prop-types';
import React from 'react';
import styled from '@emotion/styled';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { translate } from 'react-polyglot';
import { Loader } from 'decap-cms-ui-next';

import EntryListing from './EntryListing';

const PaginationMessage = styled.p`
  margin: 0 2rem 2rem 2rem;
`;

const StyledLoader = styled(Loader)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  flex: 1;
  height: 100%;
`;

function Entries({
  collections,
  entries,
  isFetching,
  viewStyle,
  cursor,
  handleCursorActions,
  t,
  page,
}) {
  const loadingMessages = [
    t('collection.entries.loadingEntries'),
    t('collection.entries.cachingEntries'),
    t('collection.entries.longerLoading'),
  ];

  if (isFetching && page === undefined) {
    return <StyledLoader size="lg">{loadingMessages}</StyledLoader>;
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

  return <PaginationMessage>{t('collection.entries.noEntries')}</PaginationMessage>;
}

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
