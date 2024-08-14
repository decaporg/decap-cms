import React from 'react';
import styled from '@emotion/styled';

import ViewStyleControl from './ViewStyleControl';
import SortControl from './SortControl';
import FilterControl from './FilterControl';
import GroupControl from './GroupControl';

const CollectionControlsContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin: 1rem;
  width: auto;
`;

function CollectionControls({
  isSearchResults,
  viewStyle,
  onChangeViewStyle,
  sortableFields,
  onSortClick,
  sort,
  viewFilters,
  viewGroups,
  onFilterClick,
  onGroupClick,
  t,
  filter,
  group,
}) {
  return (
    <CollectionControlsContainer>
      <ViewStyleControl viewStyle={viewStyle} onChangeViewStyle={onChangeViewStyle} />

      {!isSearchResults && (
        <>
          {viewGroups.length > 0 && (
            <GroupControl viewGroups={viewGroups} onGroupClick={onGroupClick} t={t} group={group} />
          )}
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
        </>
      )}
    </CollectionControlsContainer>
  );
}

export default CollectionControls;
