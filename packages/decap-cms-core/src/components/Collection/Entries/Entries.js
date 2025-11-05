import PropTypes from 'prop-types';
import React from 'react';
import styled from '@emotion/styled';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { translate } from 'react-polyglot';
import { Loader, lengths } from 'decap-cms-ui-default';

import EntryListing from './EntryListing';
import Pagination from './Pagination';

const PaginationMessage = styled.div`
  width: ${lengths.topCardWidth};
  padding: 16px;
  text-align: center;
`;

const NoEntriesMessage = styled(PaginationMessage)`
  margin-top: 16px;
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
  getWorkflowStatus,
  getUnpublishedEntries,
  filterTerm,
  paginationEnabled,
  currentPage,
  pageSize,
  totalCount,
  onPageChange,
}) {
  const loadingMessages = [
    t('collection.entries.loadingEntries'),
    t('collection.entries.cachingEntries'),
    t('collection.entries.longerLoading'),
  ];

  if (isFetching && page === undefined) {
    return <Loader active>{loadingMessages}</Loader>;
  }

  const hasEntries = (entries && entries.size > 0) || cursor?.actions?.has('append_next');

  // Calculate page count for pagination
  const pageCount = paginationEnabled && totalCount > 0 ? Math.ceil(totalCount / pageSize) : 1;

  // Show pagination controls only if pagination is enabled and we have entries
  const showPagination = paginationEnabled && totalCount > 0 && pageCount > 1;

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
          getWorkflowStatus={getWorkflowStatus}
          getUnpublishedEntries={getUnpublishedEntries}
          filterTerm={filterTerm}
          paginationEnabled={paginationEnabled}
        />
        {isFetching && page !== undefined && entries.size > 0 ? (
          <PaginationMessage>{t('collection.entries.loadingEntries')}</PaginationMessage>
        ) : null}
        {showPagination && !isFetching && (
          <Pagination
            currentPage={currentPage}
            pageCount={pageCount}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={onPageChange}
            t={t}
          />
        )}
      </>
    );
  }

  return <NoEntriesMessage>{t('collection.entries.noEntries')}</NoEntriesMessage>;
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
  getWorkflowStatus: PropTypes.func,
  getUnpublishedEntries: PropTypes.func,
  filterTerm: PropTypes.string,
  paginationEnabled: PropTypes.bool,
  paginationConfig: PropTypes.object,
  currentPage: PropTypes.number,
  pageSize: PropTypes.number,
  totalCount: PropTypes.number,
  onPageChange: PropTypes.func,
  onPageSizeChange: PropTypes.func,
};

export default translate()(Entries);
