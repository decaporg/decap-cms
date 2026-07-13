import React from 'react';
import styled from '@emotion/styled';
import { lengths } from 'decap-cms-ui-default';

import ViewStyleControl from './ViewStyleControl';
import SortControl from './SortControl';
import FilterControl from './FilterControl';
import GroupControl from './GroupControl';

const CollectionControlsContainer = styled.div`
  display: flex;
  flex-flow: row-reverse wrap;
  align-items: center;
  gap: 6px 0;
  margin-top: 22px;
  width: ${lengths.topCardWidth};
  max-width: 100%;

  @media (min-width: 500px) {
    gap: 6px;
  }
`;

function CollectionControls({
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
      <ViewStyleControl viewStyle={viewStyle} onChangeViewStyle={onChangeViewStyle} t={t} />
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
    </CollectionControlsContainer>
  );
}

export default CollectionControls;
