import React from 'react';
import styled from '@emotion/styled';
import ViewStyleControl from './ViewStyleControl';
import SortControl from './SortControl';
import FilterControl from './FilterControl';
import { lengths } from 'netlify-cms-ui-default';

const CollectionControlsContainer = styled.div`
  display: flex;
  align-items: center;
  flex-direction: row-reverse;
  margin-top: 22px;
  width: ${lengths.topCardWidth};
  max-width: 100%;

  & > div {
    margin-left: 6px;
  }
`;

const CollectionControls = ({
  viewStyle,
  onChangeViewStyle,
  sortableFields,
  onSortClick,
  sort,
  viewFilters,
  onFilterClick,
  t,
  filter,
}) => {
  return (
    <CollectionControlsContainer>
      <ViewStyleControl viewStyle={viewStyle} onChangeViewStyle={onChangeViewStyle} />
      {viewFilters.length > 0 && (
        <FilterControl
          viewFilters={viewFilters}
          onFilterClick={onFilterClick}
          t={t}
          filter={filter}
        />
      )}
      {sortableFields.length > 0 && (
        <SortControl fields={sortableFields} sort={sort} onSortClick={onSortClick} />
      )}
    </CollectionControlsContainer>
  );
};

export default CollectionControls;
