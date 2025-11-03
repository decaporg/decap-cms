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
  padding: 6px 6px 4px 6px;
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

const PageSizeSelect = styled.select`
  padding: 6px 10px;
  border: 1px solid ${colors.textFieldBorder};
  border-radius: 4px;
  background-color: ${colors.inputBackground};
  color: ${colors.text};
  font-size: 14px;
  cursor: pointer;
  outline: none;

  &:focus {
    border-color: ${colors.active};
  }
`;

const PageSizeLabel = styled.label`
  color: ${colors.text};
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

function Pagination({
  currentPage,
  pageCount,
  pageSize,
  totalCount,
  userOptions,
  onPageChange,
  onPageSizeChange,
  t,
}) {
  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < pageCount;

  const startEntry = (currentPage - 1) * pageSize + 1;
  const endEntry = Math.min(currentPage * pageSize, totalCount);

  return (
    <div>
      <PaginationControls>
        <PaginationButton
          disabled={!hasPrevPage}
          onClick={() => onPageChange(1)}
          title={t('collection.pagination.first')}
        >
          <Icon type="chevron-double" size="small" direction="left" />
        </PaginationButton>
        <PaginationButton
          disabled={!hasPrevPage}
          onClick={() => onPageChange(currentPage - 1)}
          title={t('collection.pagination.previous')}
        >
          <Icon type="chevron" size="small" direction="left" />
        </PaginationButton>

        <span style={{ color: colors.text, fontSize: '14px', padding: '0 8px' }}>
          {t('collection.pagination.page', { current: currentPage, total: pageCount })}
        </span>

        <PaginationButton
          disabled={!hasNextPage}
          onClick={() => onPageChange(currentPage + 1)}
          title={t('collection.pagination.next')}
        >
          <Icon type="chevron" size="small" direction="right" />
        </PaginationButton>
        <PaginationButton
          disabled={!hasNextPage}
          onClick={() => onPageChange(pageCount)}
          title={t('collection.pagination.last')}
        >
          <Icon type="chevron-double" size="small" direction="right" />
        </PaginationButton>
      </PaginationControls>

      <PaginationInfo>
        <span>
          {t('collection.pagination.showing', {
            start: startEntry,
            end: endEntry,
            total: totalCount,
          })}
        </span>
        {userOptions && userOptions.length > 0 && (
          <PageSizeLabel>
            {t('collection.pagination.itemsPerPage')}:
            <PageSizeSelect
              value={pageSize}
              onChange={e => onPageSizeChange(Number(e.target.value))}
            >
              {userOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </PageSizeSelect>
          </PageSizeLabel>
        )}
      </PaginationInfo>
    </div>
  );
}

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  pageCount: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  userOptions: PropTypes.arrayOf(PropTypes.number),
  onPageChange: PropTypes.func.isRequired,
  onPageSizeChange: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

export default translate()(Pagination);
