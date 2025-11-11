import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { translate } from 'react-polyglot';
import { Icon, colors } from 'decap-cms-ui-default';

const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin: 2rem;
`;

const PaginationInfo = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
`;

const PaginationButton = styled.button`
  padding: 6px 6px 4px;
  background-color: ${colors.button};
  color: ${colors.buttonText};
  border: none;
  border-radius: 4px;
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};
  font-size: 12px;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background-color: #555a65;
  }

  &:disabled {
    opacity: 0.5;
  }
`;

/**
 * Pagination component for entry collections.
 *
 * Provides accessible navigation controls for paginated entry lists.
 * Uses hybrid pagination approach - server-side by default, client-side
 * when sorting/filtering/grouping is active.
 *
 * Accessibility features:
 * - ARIA labels and roles for screen reader support
 * - Keyboard navigation support
 * - Live region announcements for page changes
 * - Proper disabled state handling
 */
function Pagination({ currentPage, pageCount, pageSize, totalCount, onPageChange, t }) {
  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < pageCount;

  const startEntry = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endEntry = totalCount === 0 ? 0 : Math.min(currentPage * pageSize, totalCount);

  return (
    <nav role="navigation" aria-label={t('collection.pagination.navigation')}>
      <PaginationControls>
        <PaginationButton
          disabled={!hasPrevPage}
          onClick={() => onPageChange(1)}
          aria-label={t('collection.pagination.first')}
          title={t('collection.pagination.first')}
          aria-disabled={!hasPrevPage}
        >
          <Icon type="chevron-double" size="small" direction="left" />
        </PaginationButton>
        <PaginationButton
          disabled={!hasPrevPage}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label={t('collection.pagination.previous')}
          title={t('collection.pagination.previous')}
          aria-disabled={!hasPrevPage}
        >
          <Icon type="chevron" size="small" direction="left" />
        </PaginationButton>

        <span
          style={{ color: colors.text, fontSize: '14px', padding: '0 8px' }}
          aria-current="page"
          aria-live="polite"
        >
          {t('collection.pagination.page', { current: currentPage, total: pageCount })}
        </span>

        <PaginationButton
          disabled={!hasNextPage}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label={t('collection.pagination.next')}
          title={t('collection.pagination.next')}
          aria-disabled={!hasNextPage}
        >
          <Icon type="chevron" size="small" direction="right" />
        </PaginationButton>
        <PaginationButton
          disabled={!hasNextPage}
          onClick={() => onPageChange(pageCount)}
          aria-label={t('collection.pagination.last')}
          title={t('collection.pagination.last')}
          aria-disabled={!hasNextPage}
        >
          <Icon type="chevron-double" size="small" direction="right" />
        </PaginationButton>
      </PaginationControls>

      <PaginationInfo role="status" aria-live="polite" aria-atomic="true">
        <span>
          {t('collection.pagination.showing', {
            start: startEntry,
            end: endEntry,
            total: totalCount,
          })}
        </span>
      </PaginationInfo>
    </nav>
  );
}

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  pageCount: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

export default translate()(Pagination);
